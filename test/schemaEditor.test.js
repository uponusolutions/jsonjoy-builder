import assert from "node:assert";
import { describe, test } from "node:test";
import {
  slugifyKey,
  uniqueKey,
  validateFieldName,
} from "../src/lib/schemaEditor.ts";

describe("validateFieldName", () => {
  test("accepts template-safe keys", () => {
    assert.strictEqual(validateFieldName("firstName"), true);
    assert.strictEqual(validateFieldName("first_name"), true);
    assert.strictEqual(validateFieldName("_private"), true);
    assert.strictEqual(validateFieldName("field123"), true);
  });

  test("rejects keys that break Go templating", () => {
    assert.strictEqual(validateFieldName("First Name"), false);
    assert.strictEqual(validateFieldName("first-name"), false);
    assert.strictEqual(validateFieldName("123field"), false);
    assert.strictEqual(validateFieldName(""), false);
    assert.strictEqual(validateFieldName("   "), false);
  });

  test("rejects the dollar sign (valid JS but invalid in Go templates)", () => {
    assert.strictEqual(validateFieldName("$special"), false);
    assert.strictEqual(validateFieldName("my$field"), false);
  });
});

describe("slugifyKey", () => {
  test("produces camelCase template-safe keys", () => {
    assert.strictEqual(slugifyKey("First Name"), "firstName");
    assert.strictEqual(slugifyKey("E-Mail Adr."), "eMailAdr");
    assert.strictEqual(slugifyKey("already"), "already");
  });

  test("prefixes a leading digit", () => {
    assert.strictEqual(slugifyKey("2. Adresse"), "_2Adresse");
  });

  test("falls back to 'field' for empty input", () => {
    assert.strictEqual(slugifyKey(""), "field");
    assert.strictEqual(slugifyKey("---"), "field");
  });

  test("always yields a valid field name", () => {
    for (const label of ["First Name", "E-Mail Adr.", "2. Adresse", "%%%"]) {
      assert.strictEqual(validateFieldName(slugifyKey(label)), true);
    }
  });
});

describe("uniqueKey", () => {
  test("returns the base when unused", () => {
    assert.strictEqual(uniqueKey("firstName", ["lastName"]), "firstName");
  });

  test("appends a counter on collision", () => {
    assert.strictEqual(uniqueKey("firstName", ["firstName"]), "firstName2");
    assert.strictEqual(
      uniqueKey("firstName", ["firstName", "firstName2"]),
      "firstName3",
    );
  });
});
