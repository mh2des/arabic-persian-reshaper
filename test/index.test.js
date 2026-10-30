var describe = require("node:test").describe;
var it = require("node:test").it;
var assert = require("node:assert");

var reshaper = require("..");

describe("index", function () {
	it("exports PersianShaper and ArabicShaper", function () {
		assert.deepStrictEqual(Object.keys(reshaper).sort(), [ "ArabicShaper", "PersianShaper" ]);
		assert.strictEqual(reshaper.ArabicShaper, require("../ArabicShaper"));
		assert.strictEqual(reshaper.PersianShaper, require("../PersianShaper"));
	});

	[ "ArabicShaper", "PersianShaper" ].forEach(function (name) {
		it(name + " exports convertArabic and convertArabicBack", function () {
			assert.deepStrictEqual(Object.keys(reshaper[name]).sort(), [ "convertArabic", "convertArabicBack" ]);
			assert.strictEqual(typeof reshaper[name].convertArabic, "function");
			assert.strictEqual(typeof reshaper[name].convertArabicBack, "function");
		});
	});
});
