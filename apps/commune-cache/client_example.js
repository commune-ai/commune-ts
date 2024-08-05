import fetch from "node-fetch";
import JSONBigInt from "json-bigint"

const result = await fetch("http://localhost:3000/api/stake-out");

const JSONBig = JSONBigInt({ useNativeBigInt: true, alwaysParseAsBig: true, strict: true });


const data = await JSONBig.parse(await result.text());

console.log(data.perAddr);

console.log("total: ", data.total)
