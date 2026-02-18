/**
 * Strips non-deterministic Mantine IDs from rendered HTML so that
 * snapshot tests produce stable output across runs.
 *
 * Mantine generates IDs like `mantine-abc123xyz` and `_r_1m_` that
 * change on every render.  This helper replaces them with fixed
 * placeholders.
 */
export function stabilizeHtml(html: string): string {
	let counter = 0;
	const seen = new Map<string, string>();

	const assign = (raw: string): string => {
		let stable = seen.get(raw);
		if (!stable) {
			stable = `__ID_${counter++}__`;
			seen.set(raw, stable);
		}
		return stable;
	};

	return html
		// Mantine component IDs:  mantine-<random>
		.replace(/mantine-[a-z0-9]+/g, (m) => assign(m))
		// Mantine inline-style class names:  __m__-_r_1m_  or similar
		.replace(/__m__-[a-z0-9_]+/g, (m) => assign(m))
		// Floating-UI / Mantine target IDs:  _r_1m_-target
		.replace(/_r_[a-z0-9_]+-target/g, (m) => assign(m));
}
