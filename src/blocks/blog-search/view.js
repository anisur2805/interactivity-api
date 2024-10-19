/**
 * WordPress dependencies
 */
import { store, getContext } from "@wordpress/interactivity";
const prevIconSVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M4 12h16M9 17s-5-3.682-5-5 5-5 5-5" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const emptyPostHTML = '<p class="no-posts-found">No posts found! </p>';

// Debounce function to limit the rate at which the search function is called.
const debounce = (func, timeout = 300) => {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
};

let lastSearchedValue = "";

const { state } = store("blog-search", {
	state: {
		results: [],
		get getDates() {
			const context = getContext();
			return new Date(context.item.date).toLocaleDateString("en-GB", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		},
	},
	actions: {
		keyup: async (event) => {
			const value = event.target.value;
			debouncedSearch(value);
		},
	},
});

const fetchPosts = async (term, paged, posts_per_page) => {
	try {
		let path = `/wp/v2/posts?search=${term}&page=${paged}&per_page=${posts_per_page}&_embed=true`;

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

// Function to handle the debounced search operation
const debouncedSearch = debounce(async (search_term) => {
	if (search_term === lastSearchedValue) {
		return;
	}

	lastSearchedValue = search_term;

	const paged = state.paged,
		posts_per_page = state.posts_per_page;

	try {
		const { posts, totalPosts, totalPages } = await fetchPosts(search_term, paged, posts_per_page);

		if (totalPosts > posts_per_page) {
			createPagination(
				totalPages,
				totalPages
			);
		} else {
			const paginationContainer = document.querySelector(
				".wpg-row-pagination",
			);

			if (paginationContainer) {
				paginationContainer.innerHTML = "";
			}
		}

		if (posts.length > 0) {
			state.results = posts.map((post, index) => {
				document.querySelector('.post-grid').innerHTML = '';
				let cleanedExcerpt = post.excerpt.rendered.replace(/<(.|\n)*?>/g, ""),
					words = cleanedExcerpt.split(/\s+/),
					truncatedExcerpt = words.slice(0, 30).join(" ");

				if (words.length > 30) {
					truncatedExcerpt += "...";
				}

				return {
				id: post.id,
				author: post._embedded.author[0].name,
				title: {
					rendered: post.title.rendered
				},
				content: {
					rendered: post.content.rendered
				},
				link: post.link,
				excerpt: {
					rendered: truncatedExcerpt
				},
				date: new Date(post.date).toLocaleDateString("en-GB", {
					day: "numeric",
					month: "short",
					year: "numeric",
				}),
				tags: post._embedded["wp:term"][1],
				read_time: calculateReadingTimeSearch(post.content.rendered),
				source_url: post._embedded["wp:featuredmedia"]?.[0]?.source_url || '',
				};
			});
		}  else {
			document.querySelector('.post-grid').innerHTML = emptyPostHTML;
			state.results = [];
		}
	} catch (error) {
		console.error("Error fetching posts:", error);
		state.results = [];
	}

}, 1000);


function stripHTMLTagsSearch(content) {
	return content.replace(/<[^>]*>/g, "");
}
function countWordsSearch(text) {
	return text.trim().split(/\s+/).length;
}
function calculateReadingTimeSearch(content, wordsPerMinute = 200) {
	const text = stripHTMLTagsSearch(content);
	const wordCount = countWordsSearch(text);

	return Math.ceil(wordCount / wordsPerMinute);
}

function createPagination(totalPages, currentPage) {
	const paginationContainer = document.querySelector(".wpg-row-pagination");

	if (!paginationContainer) {
		return;
	}

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
