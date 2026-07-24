import assert from "node:assert/strict";
import test from "node:test";
import { escapeXml, wrapXmlCdata } from "./xml";

test("escapeXml encodes text and attribute control characters", () => {
  assert.equal(
    escapeXml(`A&B <tag attr="value">'quoted'</tag>`),
    "A&amp;B &lt;tag attr=&quot;value&quot;&gt;&apos;quoted&apos;&lt;/tag&gt;",
  );
});

test("wrapXmlCdata safely splits embedded CDATA terminators", () => {
  assert.equal(
    wrapXmlCdata("before ]]> after"),
    "<![CDATA[before ]]]]><![CDATA[> after]]>",
  );
});
