import type { Page } from '@playwright/test';

type SalesOrder = {
  id: string;
  number: string;
  customerNumber?: string;
  currencyCode?: string;
  totalAmountExcludingTax?: number;
  totalTaxAmount?: number;
  totalAmountIncludingTax?: number;
};

type SalesOrderLine = {
  taxCode?: string;
  taxPercent?: number;
  amountExcludingTax?: number;
  totalTaxAmount?: number;
  amountIncludingTax?: number;
};

type DimensionSetLine = {
  id?: string;
  code?: string;
  displayName?: string;
  valueCode?: string;
  valueDisplayName?: string;
};

type ApiReadResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      status: number;
      text: string;
    };

type Item = {
  id: string;
  number: string;
};

type Location = {
  id: string;
  code: string;
};

type BcCompany = {
  id: string;
  name: string;
};

type DeleteResult = {
  orderNumber: string;
  customerNumber?: string;
  deleted: boolean;
  status: number;
  text: string;
};

async function runInBcApi<TResult, TArgs>(
  page: Page,
  args: TArgs & { companyName: string },
  operation: string
): Promise<TResult> {
  return page.evaluate(
    async ({ args, operation }) => {
      const token = document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1];
      if (!token) {
        throw new Error('BC accessToken im Webclient nicht gefunden.');
      }

      const [tenant, environment] = location.pathname.split('/').filter(Boolean);
      const root = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${environment}/api/v2.0`;
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const companiesResponse = await fetch(`${root}/companies`, { headers });
      const companies = await companiesResponse.json();
      const company = companies.value.find((entry: { name: string }) => entry.name === args.companyName);
      if (!company) {
        throw new Error(`Company ${args.companyName} nicht gefunden.`);
      }

      const api = { root, headers, company };
      return Function('api', 'args', `return (${operation})(api, args);`)(api, args);
    },
    { args, operation }
  );
}

export async function cleanupSalesOrdersByCustomer(
  page: Page,
  args: { companyName: string; customerNumber: string }
) {
  return runInBcApi<{ customerNumber: string; deleted: DeleteResult[] }, typeof args>(
    page,
    args,
    async function cleanup(api: { root: string; headers: HeadersInit; company: BcCompany }, args) {
      const filter = encodeURIComponent(`customerNumber eq '${args.customerNumber}'`);
      const ordersResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders?$filter=${filter}`, {
        headers: api.headers
      });
      const orders = await ordersResponse.json();
      const deleted = [];

      for (const order of orders.value ?? []) {
        const deleteResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders(${order.id})`, {
          method: 'DELETE',
          headers: { ...api.headers, 'If-Match': '*' }
        });
        deleted.push({
          orderNumber: order.number,
          customerNumber: order.customerNumber,
          deleted: deleteResponse.status === 204,
          status: deleteResponse.status,
          text: await deleteResponse.text()
        });
      }

      return { customerNumber: args.customerNumber, deleted };
    }.toString()
  );
}

export async function createSalesOrder(
  page: Page,
  args: { companyName: string; customerNumber: string; externalDocumentNumber: string }
) {
  return runInBcApi<SalesOrder, typeof args>(
    page,
    args,
    async function createOrder(api: { root: string; headers: HeadersInit; company: BcCompany }, args) {
      const orderResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders`, {
        method: 'POST',
        headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNumber: args.customerNumber,
          externalDocumentNumber: args.externalDocumentNumber
        })
      });
      const orderText = await orderResponse.text();
      if (!orderResponse.ok) {
        throw new Error(`Sales Order API fehlgeschlagen: ${orderResponse.status} ${orderText}`);
      }

      return JSON.parse(orderText);
    }.toString()
  );
}

export async function addSalesOrderItemLine(
  page: Page,
  args: {
    companyName: string;
    orderNumber: string;
    itemNo: string;
    locationCode: string;
    quantity: number;
    unitPrice: number;
  }
) {
  return runInBcApi<
    {
      order: SalesOrder;
      item: Item;
      location: Location;
      line: SalesOrderLine;
      orderDimensionSetLines: ApiReadResult<DimensionSetLine[]>;
    },
    typeof args
  >(
    page,
    args,
    async function addLine(api: { root: string; headers: HeadersInit; company: BcCompany }, args) {
      const orderFilter = encodeURIComponent(`number eq '${args.orderNumber}'`);
      const ordersResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders?$filter=${orderFilter}`, {
        headers: api.headers
      });
      const orders = await ordersResponse.json();
      const [order] = orders.value ?? [];
      if (!order) {
        throw new Error(`Sales Order ${args.orderNumber} nicht gefunden.`);
      }

      const itemFilter = encodeURIComponent(`number eq '${args.itemNo}'`);
      const itemsResponse = await fetch(`${api.root}/companies(${api.company.id})/items?$filter=${itemFilter}`, {
        headers: api.headers
      });
      const items = await itemsResponse.json();
      const [item] = items.value ?? [];
      if (!item) {
        throw new Error(`Item ${args.itemNo} nicht gefunden.`);
      }

      const locationFilter = encodeURIComponent(`code eq '${args.locationCode}'`);
      const locationsResponse = await fetch(`${api.root}/companies(${api.company.id})/locations?$filter=${locationFilter}`, {
        headers: api.headers
      });
      const locations = await locationsResponse.json();
      const [locationRecord] = locations.value ?? [];
      if (!locationRecord) {
        throw new Error(`Location ${args.locationCode} nicht gefunden.`);
      }

      const lineResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders(${order.id})/salesOrderLines`, {
        method: 'POST',
        headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineType: 'Item',
          itemId: item.id,
          quantity: args.quantity,
          unitPrice: args.unitPrice,
          locationId: locationRecord.id
        })
      });
      const lineText = await lineResponse.text();
      if (!lineResponse.ok) {
        throw new Error(`Sales line fehlgeschlagen: ${lineResponse.status} ${lineText}`);
      }

      const line = JSON.parse(lineText);
      const refreshedOrderResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders(${order.id})`, {
        headers: api.headers
      });
      const refreshedOrder = refreshedOrderResponse.ok ? await refreshedOrderResponse.json() : order;
      const dimensionResponse = await fetch(
        `${api.root}/companies(${api.company.id})/salesOrders(${order.id})/dimensionSetLines`,
        {
          headers: api.headers
        }
      );
      const dimensionText = await dimensionResponse.text();
      const orderDimensionSetLines = dimensionResponse.ok
        ? { ok: true, value: JSON.parse(dimensionText).value ?? [] }
        : { ok: false, status: dimensionResponse.status, text: dimensionText };

      return { order: refreshedOrder, item, location: locationRecord, line, orderDimensionSetLines };
    }.toString()
  );
}
