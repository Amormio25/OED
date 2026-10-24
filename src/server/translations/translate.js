/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Server-side translation utilities for internationalization. 
 *
 * These functions enables the display of messages in the user's selected language if supported by OED.
 * It extracts the language preference from HTTP headers and provides translation lookup functionality.
 * The default language will be English if no valid language is provided or it is not supported.
 * It mirrors the React system used on the front-end code.
 */

const ServerTranslationData = require("./data");

/**
 * Supported languages.
 * This needs to be kept in sync with the enum in src/client/app/types/redux/i18n.ts.
 */
const LANGUAGES = Object.freeze({
	en: "en",
	fr: "fr",
	es: "es",
});
const { log } = require("../log");

/**
 * Extract language from request headers
 * Reads Accept-Language header and returns best match from supported languages.
 * Will default to English if header information missing or not an OED supported language.
 * @param {object} req - Express request object
 * @returns {string} Language code ('en', 'fr', or 'es')
 */
function getLanguageFromRequest(req) {
	let lang = LANGUAGES.en;
	const acceptLanguage = req.headers["accept-language"];
	if (!acceptLanguage) {
		return lang;
	}

	const parsedLanguages = acceptLanguage.split(",").map((lang) => {
		const parts = lang.split(";");
		// Get just 'fr' from 'fr-FR'
		const code = parts[0].trim().split("-")[0];
		return code;
	});

	const code = parsedLanguages.find((code) => code in LANGUAGES);
	return code ?? lang;
}

/**
 * Translate a key to the specified language
 * @param {string} key - Translation key (e.g., 'csv.upload.error.no.file')
 * @param {string} lang - Language code (default: 'en')
 * @returns {string} Translated string or key if not found
 */
function translate(key, values = {}, lang = LANGUAGES.en) {
	if (!(lang in ServerTranslationData)) {
		log.warn(`Language ${lang} not supported.`);
		return key;
	}

	const translation = ServerTranslationData[lang][key];
	if (!translation) {
		log.warn(`Translation key not found: ${key} for language: ${lang}`);
		return key;
	}

	// Replace variable placeholders in the ServerTranslationData
	return translation.replace(/\{(\w+)\}/g, (match, varName) => {
		// Check if values has the property varName
		return Object.hasOwn(values, varName) ? values[varName] : match;
	});
}

module.exports = { translate, getLanguageFromRequest, LANGUAGES };
