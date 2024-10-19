import { __ } from "@wordpress/i18n";
import {
	useBlockProps,
	RichText,
} from "@wordpress/block-editor";

import {
	TextControl,
} from "@wordpress/components";

import { ReactComponent as SearchIcon } from "./images/search.svg";
import "./style.scss";

export default function Edit({ attributes, setAttributes }) {
	return (
		<div {...useBlockProps({ className: "wpg-blog-search" })}>
			<RichText
				tagName="h2"
				value={attributes.title}
				onChange={(value) => setAttributes({ title: value })}
			/>
			<RichText
				tagName="p"
				value={attributes.subtitle}
				onChange={(value) => setAttributes({ subtitle: value })}
			/>
			<div>
				<SearchIcon />
				<TextControl
					label={__("Search", "interactivity-api")}
					value={attributes.search_term}
					onChange={(value) => setAttributes({ search_term: value })}
				/>
			</div>
		</div>
	);
}
