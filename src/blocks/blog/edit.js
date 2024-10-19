import { __ } from "@wordpress/i18n";
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from "@wordpress/block-editor";
import { useSelect } from "@wordpress/data";
import { useEffect, useState } from "@wordpress/element";
import {
	SelectControl,
	ToggleControl,
	PanelBody,
	RangeControl,
} from "@wordpress/components";

import placeholderImage from "./images/placeholder.png";
import { ReactComponent as RightArrow } from "./images/arrow.svg";
import "./style.scss";

export default function Edit({ attributes, setAttributes }) {
	// const [sortOption, setSortOption] = useState("asc");
	const [tagId, setTagId] = useState(null);
	const [tagSlug, setTagSlug] = useState(null);
	const [tag, setTag] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const { itemsPerPage, toggleFilters, firstPostFeatured, toggleHeader, sortItem } = attributes;

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
	};

	const getTagIdBySlug = async (slug) => {
		const response = await fetch(`/wp-json/wp/v2/tags?slug=${slug}`);
		const tags = await response.json();
		return tags.length > 0 ? tags[0].id : null;
	};

	useEffect(() => {
		const fetchTagId = async () => {
			if (tagSlug) {
				const id = await getTagIdBySlug(tagSlug);
				setTagId(id);
			}
		};

		fetchTagId();
	}, [tagSlug]);

	const blogPosts = useSelect(
		(select) => {
			const query = {
				per_page: itemsPerPage,
				_embed: true,
				order: sortItem,
				tags: tagId ? [tagId] : undefined,
			};

			return select("core").getEntityRecords("postType", "post", query);
		},
		[tagId, sortItem, itemsPerPage],
	);

	const blogPostsTags = useSelect((select) => {
		const query = {
			per_page: -1,
			tags: tagId ? [tagId] : undefined,
		};

		return select("core").getEntityRecords("postType", "post", query);
	}, []);

	const uniqueTags =
		blogPostsTags
			?.flatMap((post) => post._embedded?.["wp:term"]?.[1] || [])
			.reduce((acc, tag) => {
				if (!acc.find((t) => t.id === tag.id)) {
					acc.push(tag);
				}
				return acc;
			}, []) || [];

	const isFeaturedFirstPost = firstPostFeatured
		? "interactivity-api-first-post-featured"
		: "";

	return (
		<>
			<InspectorControls>
				<PanelBody title={__("Settings")}>
					<ToggleControl
						__nextHasNoMarginBottom
						label="Toggle Blog Header Area"
						checked={toggleHeader}
						onChange={() => setAttributes({ toggleHeader: !toggleHeader })}
					/>

					<ToggleControl
						__nextHasNoMarginBottom
						label="Toggle Filter & Pagination"
						checked={toggleFilters}
						onChange={() => setAttributes({ toggleFilters: !toggleFilters })}
					/>

					<ToggleControl
						__nextHasNoMarginBottom
						label={__("First Post is Featured", "interactivity-api")}
						checked={firstPostFeatured}
						onChange={(firstPostFeatured) =>
							setAttributes({
								firstPostFeatured,
							})
						}
					/>

					<RangeControl
						__nextHasNoMarginBottom
						label={__("Items Per Page", "interactivity-api")}
						value={itemsPerPage}
						onChange={(value) => setAttributes({ itemsPerPage: value })}
						min={1}
						max={12}
					/>

					<SelectControl
						label={__("Display More Post Type", "interactivity-api")}
						value={attributes.loadPosts}
						options={[
							{ label: "None", value: "none" },
							{ label: "Pagination", value: "pagination" },
							{ label: "Load More", value: "load-more" },
						]}
						onChange={(value) => setAttributes({ loadPosts: value })}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps({ className: isFeaturedFirstPost })}>
				<div className="wpg-container">
					{blogPosts && toggleFilters ? (
						<div className="wpg-row-filter">
							<div className="wpg-row-category">
								<button type="button" aria-label="View all posts">
									{__("View All", "interactivity-api")}
								</button>

								{uniqueTags.map((tag, index) => (
									<button
										key={tag.id}
										type="button"
										onClick={() => setTagSlug(tag.name)}
										aria-label={`View all posts tagged ${tag.name}`}
									>
										{tag.name}
									</button>
								))}
							</div>
							<div className="wpg-row-sort">
								<SelectControl
									label=""
									value={sortItem}
									options={[
										{ label: "Most Recent", value: "desc" },
										{ label: "Oldest First", value: "asc" },
									]}
									onChange={(value) => setAttributes({ sortItem })}
									__nextHasNoMarginBottom
								/>
							</div>
						</div>
					) : null}

					{toggleHeader ? (
						<div className="wpg-row-header">
							<RichText
								tagName="h2"
								value={attributes.title}
								className="post__title"
								onChange={(title) => setAttributes({ title })}
							/>
							<RichText
								tagName="p"
								value={attributes.subtitle}
								className="post__subtitle"
								onChange={(subtitle) => setAttributes({ subtitle })}
							/>
						</div>
					) : null}

					{blogPosts && (
						<div className="post-grid">
							{blogPosts.map((post) => {
								const calculateReadingTime = (text) => {
									const wordsPerMinute = 200;
									const textLength = text.split(/\s+/).length;
									const readingTime = Math.ceil(textLength / wordsPerMinute);
									return readingTime;
								};

								const readingTime = calculateReadingTime(post.content.rendered);
								const dateObject = new Date(post.date);
								const formattedDate = dateObject.toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								});

								const truncateText = (text, maxLength) => {
									if (text.length > maxLength) {
										return text.slice(0, maxLength) + "...";
									}
									return text;
								};
								const excerpt = truncateText(post.content.rendered, 125);

								const featuredImage =
									post._embedded &&
									post._embedded["wp:featuredmedia"] &&
									post._embedded["wp:featuredmedia"][0]
										? post._embedded["wp:featuredmedia"][0].source_url
										: placeholderImage;

								return (
									<div key={post.id} className="post-item">
										<img className="post-featured-image" src={featuredImage} />
										<div className="post-content">
											{post._embedded["wp:term"][1].length ? (
												<ul className="post-tags">
													{post._embedded["wp:term"][1].map((tag) => (
														<li key={tag.id}>
															<a href={tag.link}>{tag.name}</a>
														</li>
													))}
												</ul>
											) : null}

											<h3 className="post-title">{post.title.rendered}</h3>
											<div
												dangerouslySetInnerHTML={{
													__html: excerpt,
												}}
											/>
											<div className="meta-info">
												<span>{post._embedded["author"][0].name}</span>
												<span>{formattedDate}</span>
												<span>{readingTime} min read</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{attributes.loadPosts === "load-more" && (
						<a className="wpg-blog-see-more" href="/blog">
							{__("See More", "interactivity-api")}
							<RightArrow />
						</a>
					)}
					{attributes.loadPosts === "pagination" && (
						<div className="wpg-row-pagination">
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
							>
								Previous
							</button>
							<span>Page {currentPage}</span>
							<button
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={!blogPosts || blogPosts.length < itemsPerPage}
							>
								Next
							</button>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
