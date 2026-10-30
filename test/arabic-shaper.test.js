/*
 * ArabicShaper-specific behaviour. Shared behaviour is in shaper.test.js.
 */
var describe = require("node:test").describe;
var it = require("node:test").it;
var assert = require("node:assert");

var ArabicShaper = require("../ArabicShaper");
var convertArabic = ArabicShaper.convertArabic;
var convertArabicBack = ArabicShaper.convertArabicBack;

function hex(s) {
	return Array.from(s, function (c) {
		return c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
	}).join(" ");
}

describe("ArabicShaper", function () {
	describe("lam-alef ligatures", function () {
		it("forms لأ لإ لآ at the start of a word", function () {
			assert.strictEqual(hex(convertArabic("لأ")), "FEF7");
			assert.strictEqual(hex(convertArabic("لإ")), "FEF9");
			assert.strictEqual(hex(convertArabic("لآ")), "FEF5");
		});

		it("forms the final لأ لإ لآ after a joining letter", function () {
			assert.strictEqual(hex(convertArabic("بلأ")), "FE91 FEF8");
			assert.strictEqual(hex(convertArabic("بلإ")), "FE91 FEFA");
			assert.strictEqual(hex(convertArabic("بلآ")), "FE91 FEF6");
		});

		it("shapes words containing the ligatures", function () {
			assert.strictEqual(hex(convertArabic("لأن")), "FEF7 FEE5");
			assert.strictEqual(hex(convertArabic("الآن")), "FE8D FEF5 FEE5");
			assert.strictEqual(hex(convertArabic("سلأ")), "FEB3 FEF8");
		});

		it("splits the ligatures back into lam and alef", function () {
			assert.strictEqual(convertArabicBack("ﻷﻸ"), "لألأ");
			assert.strictEqual(convertArabicBack("ﻹﻺ"), "لإلإ");
			assert.strictEqual(convertArabicBack("ﻵﻶ"), "لآلآ");
		});

		[ "لأن", "الآن", "لإبراهيم", "بلأ بلإ بلآ" ].forEach(function (text) {
			it("round trips " + JSON.stringify(text), function () {
				assert.strictEqual(convertArabicBack(convertArabic(text)), text);
			});
		});
	});

	describe("alef maksura", function () {
		it("shapes isolated ى", function () {
			assert.strictEqual(hex(convertArabic("ى")), "FEEF");
		});

		it("round trips words ending in ى", function () {
			assert.strictEqual(convertArabicBack(convertArabic("على")), "على");
			assert.strictEqual(convertArabicBack(convertArabic("إلى مستشفى")), "إلى مستشفى");
		});

		/*
			Bug: ArabicShaper swaps the final forms of alef maksura (U+0649)
			and Farsi yeh (U+06CC). ى ends as U+FBFD ARABIC LETTER FARSI YEH
			FINAL FORM and ی as U+FEF0 ARABIC LETTER ALEF MAKSURA FINAL FORM.
			The swap is deliberate (see the comment in ArabicShaper.js) and the
			glyphs look alike, but the code points are wrong per Unicode:
			NFKC-normalising the output of "على" gives "علی", a different
			letter. PersianShaper uses the correct code points.
		*/
		it("uses U+FEF0 for final ى", { todo: "final forms of ى and ی are swapped" }, function () {
			assert.strictEqual(hex(convertArabic("على")), "FECB FEE0 FEF0");
		});

		it("uses U+FBFD for final ی", { todo: "final forms of ى and ی are swapped" }, function () {
			assert.strictEqual(hex(convertArabic("بی")), "FE91 FBFD");
		});
	});
});
