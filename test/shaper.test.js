/*
 * Behaviour shared by ArabicShaper and PersianShaper. Expected values are
 * Unicode Arabic Presentation Forms-B code points, written as hex.
 */
var describe = require("node:test").describe;
var it = require("node:test").it;
var assert = require("node:assert");

var shapers = {
	ArabicShaper: require("../ArabicShaper"),
	PersianShaper: require("../PersianShaper")
};

function hex(s) {
	return Array.from(s, function (c) {
		return c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
	}).join(" ");
}

var dualJoining = [
	/* letter, isolated, initial, medial, final */
	[ "ئ", "FE89", "FE8B", "FE8C", "FE8A" ],
	[ "ب", "FE8F", "FE91", "FE92", "FE90" ],
	[ "ت", "FE95", "FE97", "FE98", "FE96" ],
	[ "ث", "FE99", "FE9B", "FE9C", "FE9A" ],
	[ "ج", "FE9D", "FE9F", "FEA0", "FE9E" ],
	[ "ح", "FEA1", "FEA3", "FEA4", "FEA2" ],
	[ "خ", "FEA5", "FEA7", "FEA8", "FEA6" ],
	[ "س", "FEB1", "FEB3", "FEB4", "FEB2" ],
	[ "ش", "FEB5", "FEB7", "FEB8", "FEB6" ],
	[ "ص", "FEB9", "FEBB", "FEBC", "FEBA" ],
	[ "ض", "FEBD", "FEBF", "FEC0", "FEBE" ],
	[ "ط", "FEC1", "FEC3", "FEC4", "FEC2" ],
	[ "ظ", "FEC5", "FEC7", "FEC8", "FEC6" ],
	[ "ع", "FEC9", "FECB", "FECC", "FECA" ],
	[ "غ", "FECD", "FECF", "FED0", "FECE" ],
	[ "ف", "FED1", "FED3", "FED4", "FED2" ],
	[ "ق", "FED5", "FED7", "FED8", "FED6" ],
	[ "ك", "FED9", "FEDB", "FEDC", "FEDA" ],
	[ "ل", "FEDD", "FEDF", "FEE0", "FEDE" ],
	[ "م", "FEE1", "FEE3", "FEE4", "FEE2" ],
	[ "ن", "FEE5", "FEE7", "FEE8", "FEE6" ],
	[ "ه", "FEE9", "FEEB", "FEEC", "FEEA" ],
	[ "ي", "FEF1", "FEF3", "FEF4", "FEF2" ]
];

var rightJoining = [
	/* letter, isolated, final */
	[ "ا", "FE8D", "FE8E" ],
	[ "آ", "FE81", "FE82" ],
	[ "أ", "FE83", "FE84" ],
	[ "إ", "FE87", "FE88" ],
	[ "ؤ", "FE85", "FE86" ],
	[ "ة", "FE93", "FE94" ],
	[ "د", "FEA9", "FEAA" ],
	[ "ذ", "FEAB", "FEAC" ],
	[ "ر", "FEAD", "FEAE" ],
	[ "ز", "FEAF", "FEB0" ],
	[ "و", "FEED", "FEEE" ]
];

Object.keys(shapers).forEach(function (name) {
	var convertArabic = shapers[name].convertArabic;
	var convertArabicBack = shapers[name].convertArabicBack;

	describe(name, function () {
		describe("contextual forms", function () {
			dualJoining.forEach(function (row) {
				var letter = row[0];
				it("shapes " + letter + " as isolated, initial, medial and final", function () {
					assert.strictEqual(hex(convertArabic(letter)), row[1]);
					assert.strictEqual(hex(convertArabic(letter + letter + letter)), [ row[2], row[3], row[4] ].join(" "));
				});
			});

			it("shapes whole words", function () {
				assert.strictEqual(hex(convertArabic("كتب")), "FEDB FE98 FE90");
				assert.strictEqual(hex(convertArabic("محمد")), "FEE3 FEA4 FEE4 FEAA");
				assert.strictEqual(hex(convertArabic("مرحبا بالعالم")),
					"FEE3 FEAE FEA3 FE92 FE8E 0020 FE91 FE8E FEDF FECC FE8E FEDF FEE2");
			});

			it("keeps tatweel and joins letters through it", function () {
				assert.strictEqual(hex(convertArabic("ـبـ")), "0640 FE92 0640");
			});

			it("returns strings", function () {
				assert.strictEqual(typeof convertArabic("كتب"), "string");
				assert.strictEqual(typeof convertArabicBack("ﻛﺘﺐ"), "string");
			});
		});

		describe("letters that don't join forward", function () {
			rightJoining.forEach(function (row) {
				var letter = row[0];
				it("joins " + letter + " only to the previous letter", function () {
					assert.strictEqual(hex(convertArabic(letter)), row[1]);
					assert.strictEqual(hex(convertArabic("ب" + letter)), "FE91 " + row[2]);
					// The letter after it has to start a new joined group.
					assert.strictEqual(hex(convertArabic("ب" + letter + "ب")), "FE91 " + row[2] + " FE8F");
					assert.strictEqual(hex(convertArabic(letter + "بب")), row[1] + " FE91 FE90");
				});
			});

			it("never joins hamza on either side", function () {
				assert.strictEqual(hex(convertArabic("ء")), "FE80");
				assert.strictEqual(hex(convertArabic("بءب")), "FE8F FE80 FE8F");
			});
		});

		describe("lam-alef ligature", function () {
			it("forms لا at the start of a word", function () {
				assert.strictEqual(hex(convertArabic("لا")), "FEFB");
				assert.strictEqual(hex(convertArabic("لاب")), "FEFB FE8F");
			});

			it("forms the final لا after a joining letter", function () {
				assert.strictEqual(hex(convertArabic("بلا")), "FE91 FEFC");
				assert.strictEqual(hex(convertArabic("سلام")), "FEB3 FEFC FEE1");
			});

			it("forms the isolated لا after a letter that doesn't join forward", function () {
				assert.strictEqual(hex(convertArabic("دلا")), "FEA9 FEFB");
			});

			it("doesn't form a ligature when lam is followed by another letter", function () {
				assert.strictEqual(hex(convertArabic("الله")), "FE8D FEDF FEE0 FEEA");
			});

			/*
				Bug: when a diacritic sits between lam and alef, convertArabic
				finds the alef past the diacritic but then skips only one
				character (i = i+1). The diacritic is dropped and the alef is
				shaped a second time, so "لَا" currently becomes FEFB FE8E.
				The diacritic should be kept after the ligature.
			*/
			it("keeps a diacritic between lam and alef", { todo: "lam-alef branch drops the diacritic and repeats the alef" }, function () {
				assert.strictEqual(hex(convertArabic("لَا")), "FEFB 064E");
				assert.strictEqual(hex(convertArabic("بلَا")), "FE91 FEFC 064E");
			});
		});

		describe("diacritics", function () {
			it("treats harakat as transparent and keeps them in place", function () {
				assert.strictEqual(hex(convertArabic("كَتَبَ")), "FEDB 064E FE98 064E FE90 064E");
			});

			it("treats shadda and tanween as transparent", function () {
				assert.strictEqual(hex(convertArabic("محمّد")), "FEE3 FEA4 FEE4 0651 FEAA");
				assert.strictEqual(hex(convertArabic("كتابًا")), "FEDB FE98 FE8E FE91 064B FE8E");
			});

			it("keeps a diacritic after a ligature", function () {
				assert.strictEqual(hex(convertArabic("لاَ")), "FEFB 064E");
			});
		});

		describe("non-Arabic text", function () {
			it("returns the empty string unchanged", function () {
				assert.strictEqual(convertArabic(""), "");
				assert.strictEqual(convertArabicBack(""), "");
			});

			it("returns non-Arabic text unchanged", function () {
				[ "Hello, world! 123", "Привет", "你好", "😀 emoji", "\t\n " ].forEach(function (text) {
					assert.strictEqual(convertArabic(text), text);
					assert.strictEqual(convertArabicBack(text), text);
				});
			});

			it("returns Arabic punctuation and digits unchanged", function () {
				var text = "، ؛ ؟ ٠١٢٣٤٥٦٧٨٩";
				assert.strictEqual(convertArabic(text), text);
				assert.strictEqual(convertArabicBack(text), text);
			});

			it("breaks joining at non-Arabic characters", function () {
				assert.strictEqual(hex(convertArabic("بaب")), "FE8F 0061 FE8F");
				assert.strictEqual(hex(convertArabic("abc كتب 123")),
					"0061 0062 0063 0020 FEDB FE98 FE90 0020 0031 0032 0033");
			});

			it("leaves unshaped Arabic unchanged in convertArabicBack", function () {
				assert.strictEqual(convertArabicBack("كتب"), "كتب");
			});
		});

		describe("convertArabicBack", function () {
			it("restores base letters from every form", function () {
				dualJoining.forEach(function (row) {
					var forms = String.fromCharCode.apply(null, row.slice(1).map(function (h) { return parseInt(h, 16); }));
					assert.strictEqual(convertArabicBack(forms), row[0] + row[0] + row[0] + row[0], row[0]);
				});
				rightJoining.forEach(function (row) {
					var forms = String.fromCharCode(parseInt(row[1], 16), parseInt(row[2], 16));
					assert.strictEqual(convertArabicBack(forms), row[0] + row[0], row[0]);
				});
			});

			it("splits the لا ligature into lam and alef", function () {
				assert.strictEqual(convertArabicBack("ﻻ"), "لا");
				assert.strictEqual(convertArabicBack("ﻼ"), "لا");
			});

			[
				"كتب",
				"بسم الله الرحمن الرحيم",
				"لا إله إلا الله",
				"السلام عليكم ورحمة الله وبركاته",
				"مَدْرَسَةٌ جَمِيلَةٌ",
				"قرأ سؤال مسؤول",
				"ـبـ",
				"abc كتب 123 ؟"
			].forEach(function (text) {
				it("round trips " + JSON.stringify(text), function () {
					assert.strictEqual(convertArabicBack(convertArabic(text)), text);
				});
			});
		});
	});
});
