import { DOMParser } from "@xmldom/xmldom";

const SEDO_BASE = "https://api.sedo.com/api/v1";

interface SedoFault {
  faultcode: string;
  faultstring: string;
}

interface SedoCallOptions {
  partnerid: number;
  signkey: string;
  username: string;
  password: string;
  [key: string]: string | number | undefined;
}

export async function callSedo(
  fn: string,
  options: SedoCallOptions
): Promise<Record<string, string | number>[]> {
  const params = new URLSearchParams();
  params.set("output_method", "xml");

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const url = `${SEDO_BASE}/${fn}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/xml" },
  });

  if (!response.ok) {
    throw new Error("Could not reach Sedo. Try again.");
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const faultElement = doc.documentElement;
  if (!faultElement) {
    throw new Error("Could not reach Sedo. Try again.");
  }

  let faultstring = "";
  let faultcode = "";

  if (faultElement.tagName === "SEDOFAULT") {
    faultcode = faultElement.getElementsByTagName("faultcode")[0]?.textContent ?? "";
    faultstring = faultElement.getElementsByTagName("faultstring")[0]?.textContent ?? "";
  } else {
    const faultNodes = doc.getElementsByTagName("faultstring");
    if (faultNodes.length > 0) {
      faultstring = faultNodes[0].textContent ?? "";
      const codeNodes = doc.getElementsByTagName("faultcode");
      faultcode = codeNodes[0]?.textContent ?? "";
    }
  }

  if (faultstring) {
    const error = new Error(faultstring) as Error & SedoFault;
    error.faultcode = faultcode;
    error.faultstring = faultstring;
    throw error;
  }

  const items: Record<string, string | number>[] = [];
  const itemElements = doc.getElementsByTagName("item");

  for (let i = 0; i < itemElements.length; i++) {
    const item = itemElements[i];
    const obj: Record<string, string | number> = {};
    const children = item.childNodes;

    for (let j = 0; j < children.length; j++) {
      const child = children[j];
      if (child.nodeType === 1) {
        const key = child.nodeName;
        const value = child.textContent ?? "";
        const num = Number(value);
        obj[key] = isNaN(num) ? value : num;
      }
    }

    items.push(obj);
  }

  return items;
}
