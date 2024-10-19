<?php
/**
 * Ajax filter posts
 *
 */
add_action( 'wp_ajax_filter_posts', 'INTER_API_filter_posts' );
add_action( 'wp_ajax_nopriv_filter_posts', 'INTER_API_filter_posts' );

function INTER_API_filter_posts() {
	// Verify nonce.
	if ( ! isset( $_POST['nonce'] ) || false === wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'INTER_API_filter_posts_nonce' ) ) {
		wp_send_json_error(
			array(
				'message' => __( 'Invalid nonce. Please refresh the page and try again.', 'interactivity-api' ),
			)
		);
		wp_die();
	}

	error_log( 'args' . print_r( $_POST, true ) );

	// Get request data with proper sanitization.
	$tag          = isset( $_POST['tag'] ) ? sanitize_text_field( wp_unslash( $_POST['tag'] ) ) : '';
	$order        = isset( $_POST['order'] ) ? sanitize_text_field( wp_unslash( $_POST['order'] ) ) : 'DESC';
	$paged        = isset( $_POST['paged'] ) ? absint( wp_unslash( $_POST['paged'] ) ) : 1;
	$limit        = isset( $_POST['limit'] ) ? absint( wp_unslash( $_POST['limit'] ) ) : get_option( 'posts_per_page' );
	$search_value = isset( $_POST['s'] ) ? sanitize_text_field( wp_unslash( $_POST['s'] ) ) : '';

	// Build query args.
	$args = array(
		'posts_per_page' => $limit,
		'order'          => $order,
		'post_status'    => 'publish',
		'paged'          => $paged,
		'post_type'      => 'post',
	);

	// Handle tag filtering.
	if ( '' !== $tag && 'all' !== $tag ) {
		$args['tax_query'] = array(
			array(
				'taxonomy' => 'post_tag',
				'field'    => 'slug',
				'terms'    => $tag,
			),
		);
	}

	// Handle search query.
	if ( '' !== $search_value ) {
		$args['s'] = $search_value;
	}
	error_log( 'query' . print_r( $args, true ) );

	// Execute WP Query.
	$query = new WP_Query( $args );

	if ( $query->have_posts() ) {
		$posts_data = array();

		// Collect post data.
		while ( $query->have_posts() ) {
			$query->the_post();
			$post_content = get_the_content( get_the_ID() );
			$post_tags    = get_the_tags( get_the_ID() );
			$post_date    = get_the_date( 'F j, Y', get_the_ID() );
			$reading_time = ceil( str_word_count( wp_strip_all_tags( $post_content ) ) / 200 );

			$tags = array();
			if ( ! empty( $post_tags ) ) {
				foreach ( $post_tags as $tag_item ) {
					$tags[] = array(
						'id'   => $tag_item->term_id,
						'name' => $tag_item->name,
						'link' => get_tag_link( $tag_item->term_id ),
					);
				}
			}

			$posts_data[] = array(
				'title'          => get_the_title(),
				'content'        => wp_trim_words( $post_content, 20, '...' ),
				'excerpt'        => esc_html( wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 30, '...' ) ),
				'author'         => get_the_author(),
				'author_link'    => get_author_posts_url( get_the_author_meta( 'ID' ) ),
				'date'           => $post_date,
				'read_time'      => $reading_time . ' min read',
				'tags'           => $tags,
				'link'           => get_permalink(),
				'featured_image' => has_post_thumbnail() ? get_the_post_thumbnail_url() : INTER_API_BLOCKS . '/blog/images/placeholder.png',
			);
		}

		// Generate pagination.
		$pagination = paginate_links(
			array(
				'base'      => '%_%',
				'format'    => '?paged=%#%',
				'current'   => $paged,
				'total'     => $query->max_num_pages,
				'type'      => 'array',
				'prev_text' => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h16M9 17s-5-3.682-5-5 5-5 5-5" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
				'next_text' => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12H4m11 5s5-3.682 5-5-5-5-5-5" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
			)
		);

		// Return success response.
		wp_send_json_success(
			array(
				'posts'      => $posts_data,
				'pagination' => $pagination,
				'found'      => $query->found_posts,
			)
		);
	} else {
		// Return error if no posts found.
		wp_send_json_error(
			array(
				'message'    => __( 'No posts found from API', 'interactivity-api' ),
				'posts'      => array(),
				'pagination' => array(),
				'found'      => 0,
			)
		);
	}

	wp_reset_postdata();
}
