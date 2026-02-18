import { useRef, useState } from "react";

type ParseResult = { value?: number; error?: string | boolean };
type ParseFn = (raw: string, key: string) => ParseResult;

function toStrings<K extends string>(f: Record<K, number | undefined>): Record<K, string> {
	const result = {} as Record<K, string>;
	for (const key of Object.keys(f) as K[]) {
		result[key] = f[key]?.toString() ?? "";
	}
	return result;
}

/**
 * Manages a set of numeric text inputs with validation.
 * Handles the common pattern of:
 * - Storing raw string values for controlled text inputs
 * - Syncing from external numeric values (schema props)
 * - Parsing + validating on every keystroke
 * - Only propagating valid values via onChange
 */
export function useValidatedNumericInputs<K extends string>(
	fields: Record<K, number | undefined>,
	parse: ParseFn,
): {
	/** Raw string values for controlled inputs */
	values: Record<K, string>;
	/** Parsed validation results per field */
	validations: Record<K, ParseResult>;
	/** Call this from input onChange; returns parsed value if valid, undefined if error */
	handleChange: (key: K, raw: string) => { value?: number; error?: string | boolean };
} {
	const [values, setValues] = useState(() => toStrings(fields));

	// Sync state from props when external values change (React-recommended pattern)
	const prevFingerprint = useRef(JSON.stringify(fields));
	const fingerprint = JSON.stringify(fields);
	if (fingerprint !== prevFingerprint.current) {
		prevFingerprint.current = fingerprint;
		setValues(toStrings(fields));
	}

	const validations = {} as Record<K, ParseResult>;
	for (const key of Object.keys(values) as K[]) {
		validations[key] = parse(values[key], key);
	}

	const handleChange = (key: K, raw: string) => {
		setValues((prev) => ({ ...prev, [key]: raw }));
		const parsed = parse(raw, key);
		return parsed;
	};

	return { values, validations, handleChange };
}
