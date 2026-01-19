# @senditly/node

Senditly SDK for node.

- https://senditly.ai/docs/api-references/transactional/#overview


## Usage

Install

```shell
bun add @senditly/node
```

Import

```ts
import SenditlyClient from "@senditly/node";

const client = new SenditlyClient({ apiKey: process.env.SENDITLY_API_KEY });
```

Send Email

```ts
await client.transactional.send({
  to: "xxx.yyy@zzz.com",
  templateId: "xxxxx",
});
```
