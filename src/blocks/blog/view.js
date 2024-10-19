import { store, getContext } from "@wordpress/interactivity";
const prevIconSVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M4 12h16M9 17s-5-3.682-5-5 5-5 5-5" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const emptyPostHTML = '<p class="no-posts-found">No posts found! </p>';

const fetchPosts = async (tagId, order, paged, posts_per_page, searchValue) => {
	try {
		let path = `/wp/v2/posts?order=${order}&page=${paged}&per_page=${posts_per_page}&_embed=true`;
		if (tagId && tagId !== "0") {
			path += `&tags=${tagId}`;
		}

		
		if ( searchValue ) {
			path += `&search=${searchValue}`;
		}

		const response = await wp.apiFetch({
			path: path,
			parse: false,
		});

		const posts = await response.json();
		const totalPosts = response.headers.get("X-WP-Total");
		const totalPages = response.headers.get("X-WP-TotalPages");

		return { posts, totalPosts, totalPages };
	} catch (error) {
		console.error("Error fetching posts:", error);
		return [];
	}
};

function stripHTMLTags(content) {
	return content.replace(/<[^>]*>/g, "");
}
function countWords(text) {
	return text.trim().split(/\s+/).length;
}
function calculateReadingTime(content, wordsPerMinute = 200) {
	const text = stripHTMLTags(content);
	const wordCount = countWords(text);

	return Math.ceil(wordCount / wordsPerMinute);
}

// Store definition
const { state } = store("blog-search", {
	state: {
		results: [],
		get getDate() {
			const context = getContext();
			return new Date(context.item.date).toLocaleDateString("en-GB", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		},
		get authorName() {
			const context = getContext();
			return context.item._embedded.author[0].name;
		},
		get featureImage() {
			const context = getContext();
			return context.item._embedded["wp:featuredmedia"][0].media_details.sizes
				.full.source_url;
		},
	},
	actions: {
		filterByTag: async (event) => {
			const button = event.currentTarget;
			const context = getContext();

			const tag_Id = button.getAttribute("data-tag-id");
			context.tagId = tag_Id;

			const select = document.querySelector("#sort-order").value,
				search_value = document.querySelector("#wpg-search-input")?.value || '';

			context.order = select;
			const posts_per_page = state.posts_per_page,
				tagId = context.tagId,
				order = context.order,
				paged = context.paged,
				searchValue = search_value;

			try {
				context.results = [];
				const {
					posts: response,
					totalPosts,
					totalPages,
				} = await fetchPosts(tagId, order, paged, posts_per_page, searchValue);

				context.results = response;
				state.results = response;

				const postContainer = document.querySelector(".post-grid");
					postContainer.innerHTML = "";

				if (totalPosts > posts_per_page) {
					createPagination(totalPages, totalPages);
				} else {
					const paginationContainer = document.querySelector(
						".wpg-row-pagination",
					);
					paginationContainer.innerHTML = "";
				}

				if (! response.length ) {
					document.querySelector('.post-grid').innerHTML = '<p class="no-posts-found">No posts found! </p>';
					state.results = [];
					return;
				}

				return response.map((post, index) => {
					context.results[index].author = post._embedded.author[0].name;
					context.results[index].content.rendered = post.content.rendered;

					let cleanedExcerpt = post.excerpt.rendered.replace(/<(.|\n)*?>/g, ""),
						words = cleanedExcerpt.split(/\s+/),
						truncatedExcerpt = words.slice(0, 30).join(" ");

					if (words.length > 30) {
						truncatedExcerpt += "...";
					}

					context.results[index].excerpt.rendered = truncatedExcerpt;

					context.results[index].read_time = calculateReadingTime(
						post.content.rendered,
					);

					context.results[index].tags = post._embedded["wp:term"][1];

					return (context.results[index].source_url =
						post._embedded["wp:featuredmedia"]?.[0]?.source_url || '');
				});
			} catch (error) {
				console.error("Error fetching posts:", error);
				state.results = [];
			}
		},
		// Function to handle sorting
		filterByOrder: async (event) => {
			const select = event.currentTarget;
			const context = getContext();

			context.order = select.value;

			const search_value = document.querySelector("#wpg-search-input")?.value || '';

			const posts_per_page = context.posts_per_page,
				tagId = context.tagId,
				order = context.order,
				paged = context.paged,
				searchValue = search_value;

			try {
				const {
					posts: response,
					totalPosts,
					totalPages,
				} = await fetchPosts(tagId, order, paged, posts_per_page, searchValue);

				context.results = response;
				state.results = response;

				if (totalPosts > posts_per_page) {
					const postContainer = document.querySelector(".post-grid");
					postContainer.innerHTML = "";
					createPagination(totalPages, totalPages);
				} else {
					const paginationContainer = document.querySelector(
						".wpg-row-pagination",
					);
					paginationContainer.innerHTML = "";
				}

				return response.map((post, index) => {
					context.results[index].author = post._embedded.author[0].name;
					context.results[index].content.rendered = post.content.rendered;

					let cleanedExcerpt = post.excerpt.rendered.replace(/<(.|\n)*?>/g, ""),
						words = cleanedExcerpt.split(/\s+/),
						truncatedExcerpt = words.slice(0, 30).join(" ");

					if (words.length > 30) {
						truncatedExcerpt += "...";
					}

					context.results[index].excerpt.rendered = truncatedExcerpt;

					context.results[index].read_time = calculateReadingTime(
						post.content.rendered,
					);

					context.results[index].tags = post._embedded["wp:term"][1];

					return (context.results[index].source_url =
						post._embedded["wp:featuredmedia"]?.[0]?.source_url || '');
				});
			} catch (error) {
				console.error("Error fetching posts:", error);
				state.results = [];
			}
		},
	},
	// Initial callback for fetching posts when the page first loads
	callbacks: {
		initialize: async () => {
			const context = getContext();
			state.results = context.results;

			return state.results;
		},
	},
});

function createPagination(totalPages, currentPage) {
	const paginationContainer = document.querySelector(".wpg-row-pagination");
	paginationContainer.innerHTML = "";

	if (totalPages <= 1) {
		return;
	}

	let firstIconAdded = false;

	function createPageElement(type, pageNumber, isCurrent = false) {
		const element = document.createElement(type);

		if (type === "a") {
			element.className = "page-numbers";
			element.href = `/page/${pageNumber}/`;

			if (!firstIconAdded) {
				element.classList.add("prev");
				element.innerHTML = prevIconSVG;
				firstIconAdded = true;
			} else {
				element.textContent = pageNumber;
			}
		} else if (type === "span") {
			element.className = "page-numbers current";
			element.setAttribute("aria-current", "page");
			element.textContent = pageNumber;
		}

		if (isCurrent) {
			element.classList.add("current");
		}

		return element;
	}

	if (currentPage > 1) {
		const prevLink = createPageElement("a", currentPage - 1);
		prevLink.classList.add("prev");
		paginationContainer.appendChild(prevLink);
	}

	for (let i = 1; i <= totalPages; i++) {
		const pageElement =
			i === currentPage
				? createPageElement("span", i, true)
				: createPageElement("a", i);
		paginationContainer.appendChild(pageElement);
	}

	if (currentPage < totalPages) {
		const nextLink = createPageElement("a", currentPage + 1);
		nextLink.classList.add("next");
		paginationContainer.appendChild(nextLink);
	}
}
