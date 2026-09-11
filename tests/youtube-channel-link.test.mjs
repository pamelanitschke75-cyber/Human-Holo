import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);

test("offizieller Human-Holo-Kanal ist mit beiden Gründerinnen sichtbar verknüpft", () => {
  assert.match(ui, /id: "UCcqR_Mt4OKFlA1sAYneZTcg"/u);
  assert.match(
    ui,
    /name: "Human Holo – Pamela Nitschke & Stefanie Hörath"/u
  );
  assert.match(
    ui,
    /url: "https:\/\/www\.youtube\.com\/channel\/UCcqR_Mt4OKFlA1sAYneZTcg"/u
  );
  assert.match(ui, /id="youtubeChannelRow"/u);
  assert.match(ui, />YouTube · Human Holo</u);
  assert.match(
    ui,
    />Offizieller Kanal von Pamela Nitschke &amp; Stefanie Hörath</u
  );
  assert.match(
    ui,
    /id="youtubeChannelStatus" class="serviceStatus connected">Verknüpft</u
  );
});

test("Kanal-Link bleibt ownergebunden und öffnet ausschließlich die öffentliche URL", () => {
  const handler = ui.match(
    /document\.getElementById\("youtubeChannelRow"\)[\s\S]*?\n  \}\);/u
  )?.[0] ?? "";

  assert.notEqual(handler, "");
  assert.match(handler, /requireActivePersonalOwner\(\)/u);
  assert.match(handler, /window\.open\(/u);
  assert.match(handler, /HUMAN_HOLO_YOUTUBE_CHANNEL\.url/u);
  assert.match(handler, /"_blank"/u);
  assert.match(handler, /"noopener"/u);
});

test("öffentliche Verknüpfung erteilt keine YouTube-Konto- oder Uploadrechte", () => {
  assert.match(
    ui,
    /nur als öffentlicher Link hinterlegt;[^\n]*keine Upload- oder Verwaltungsrechte/u
  );
  assert.doesNotMatch(ui, /youtube\.upload|youtube\.force-ssl|youtube\.readonly/u);
});
