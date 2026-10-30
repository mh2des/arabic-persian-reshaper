/*
 * PersianShaper-specific behaviour. Shared behaviour is in shaper.test.js.
 * Persian letters live in Arabic Presentation Forms-A (U+FB50 to U+FDFF).
 */
var describe = require("node:test").describe;
var it = require("node:test").it;
var assert = require("node:assert");

var PersianShaper = require("../PersianShaper");
var convertArabic = PersianShaper.convertArabic;
var convertArabicBack = PersianShaper.convertArabicBack;

function hex(s) {
	return Array.from(s, function (c) {
		return c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
	}).join(" ");
}

var dualJoining = [
	/* letter, isolated, initial, medial, final */
	[ "پ", "FB56", "FB58", "FB59", "FB57" ],
	[ "چ", "FB7A", "FB7C", "FB7D", "FB7B" ],
	[ "ک", "FB8E", "FB90", "FB91", "FB8F" ],
	[ "گ", "FB92", "FB94", "FB95", "FB93" ],
	[ "ی", "FBFC", "FBFE", "FBFF", "FBFD" ]
];

describe("PersianShaper", function () {
	describe("Persian letters", function () {
		dualJoining.forEach(function (row) {
			var letter = row[0];
			it("shapes " + letter + " as isolated, initial, medial and final", function () {
				assert.strictEqual(hex(convertArabic(letter)), row[1]);
				assert.strictEqual(hex(convertArabic(letter + letter + letter)), [ row[2], row[3], row[4] ].join(" "));
			});
		});

		it("joins ژ only to the previous letter", function () {
			assert.strictEqual(hex(convertArabic("ژ")), "FB8A");
			assert.strictEqual(hex(convertArabic("بژ")), "FE91 FB8B");
			assert.strictEqual(hex(convertArabic("بژب")), "FE91 FB8B FE8F");
		});

		it("shapes Persian words", function () {
			assert.strictEqual(hex(convertArabic("پنج")), "FB58 FEE8 FE9E");
			assert.strictEqual(hex(convertArabic("چای")), "FB7C FE8E FBFC");
			assert.strictEqual(hex(convertArabic("پیچ")), "FB58 FBFF FB7B");
			assert.strictEqual(hex(convertArabic("کتاب")), "FB90 FE98 FE8E FE8F");
			assert.strictEqual(hex(convertArabic("ژاله")), "FB8A FE8D FEDF FEEA");
			assert.strictEqual(hex(convertArabic("یک")), "FBFE FB8F");
		});

		it("breaks joining at a zero-width non-joiner", function () {
			assert.strictEqual(hex(convertArabic("می‌خواهم")), "FEE3 FBFD 200C FEA7 FEEE FE8D FEEB FEE2");
		});

		it("uses U+FEF0 for final ى and U+FBFD for final ی", function () {
			assert.strictEqual(hex(convertArabic("بى")), "FE91 FEF0");
			assert.strictEqual(hex(convertArabic("بی")), "FE91 FBFD");
		});
	});

	describe("convertArabicBack", function () {
		it("restores Persian letters from every form", function () {
			dualJoining.forEach(function (row) {
				var forms = String.fromCharCode.apply(null, row.slice(1).map(function (h) { return parseInt(h, 16); }));
				assert.strictEqual(convertArabicBack(forms), row[0] + row[0] + row[0] + row[0], row[0]);
			});
			assert.strictEqual(convertArabicBack("ﮊﮋ"), "ژژ");
		});

		[ "پچژگی", "سلام دنیا", "می‌خواهم به خانه بروم", "گچ پژ کتاب" ].forEach(function (text) {
			it("round trips " + JSON.stringify(text), function () {
				assert.strictEqual(convertArabicBack(convertArabic(text)), text);
			});
		});
	});

	/*
		Bug: PersianShaper's combCharsMap has the lam + أ/إ/آ ligatures
		commented out, but convertArabic still takes the ligature branch
		for them. GetCombCharRep returns false and String.fromCharCode
		emits U+0000 in place of both letters, so "لآلی" (pearls) currently
		becomes 0000 FEDF FBFD. These tests expect the same ligatures as
		ArabicShaper.
	*/
	describe("lam-alef ligatures with hamza and madda", function () {
		var todo = { todo: "lam + أ/إ/آ is replaced by U+0000" };

		it("forms لأ لإ لآ at the start of a word", todo, function () {
			assert.strictEqual(hex(convertArabic("لأ")), "FEF7");
			assert.strictEqual(hex(convertArabic("لإ")), "FEF9");
			assert.strictEqual(hex(convertArabic("لآ")), "FEF5");
		});

		it("forms the final لأ لإ لآ after a joining letter", todo, function () {
			assert.strictEqual(hex(convertArabic("بلأ")), "FE91 FEF8");
			assert.strictEqual(hex(convertArabic("بلإ")), "FE91 FEFA");
			assert.strictEqual(hex(convertArabic("بلآ")), "FE91 FEF6");
		});

		[ "لآلی", "تلألؤ" ].forEach(function (text) {
			it("round trips " + JSON.stringify(text), todo, function () {
				assert.strictEqual(convertArabicBack(convertArabic(text)), text);
			});
		});
	});
});
