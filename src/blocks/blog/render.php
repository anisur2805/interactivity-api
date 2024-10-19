<?php
$posts               = array();
$big                 = 999999999;
$pagination          = '';
$featured_post_class = '';
$paged               = get_query_var( 'paged' ) ? absint( get_query_var( 'paged' ) ) : 1;
$items_per_page      = isset( $attributes['itemsPerPage'] ) ? absint( $attributes['itemsPerPage'] ) : 5;
$post_offset         = ( $paged - 1 ) * $items_per_page;

$query_args = array(
	'posts_per_page' => absint( $attributes['itemsPerPage'] ),
	'order'          => sanitize_text_field( $attributes['sortItem'] ),
	'offset'         => $post_offset,
	'post_status'    => 'publish',
);

$latest_posts = new WP_Query( $query_args );

if ( $latest_posts->have_posts() ) {
	while ( $latest_posts->have_posts() ) {
		$latest_posts->the_post();

		$trimmed_excerpt = esc_html( wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 30, '...' ) );

		$image_url = '';

		if ( isset( $attributes['firstPostFeatured'] ) && 1 === absint( $attributes['firstPostFeatured'] ) && 0 === $latest_posts->current_post ) {
			$featured_post_class = 'interactivity-api-first-post-featured';
			$image_url           = wp_get_attachment_image_url( get_post_thumbnail_id(), 'interactivity-api-post-featured-image' );
		} else {
			$image_url = wp_get_attachment_image_url( get_post_thumbnail_id(), 'interactivity-api-post-image' );
		}

		$posts[] = array(
			'title'      => array(
				'rendered' => esc_html( get_the_title() ),
			),
			'id'         => get_the_ID(),
			'link'       => esc_url( get_permalink() ),
			'source_url' => esc_url( wp_get_attachment_url( get_post_thumbnail_id() ) ),
			'image'      => esc_url( $image_url ),
			'excerpt'    => array(
				'rendered' => $trimmed_excerpt,
			),
			'author'     => esc_html( get_the_author_meta( 'display_name' ) ),
			'date'       => esc_html( get_the_date( 'F j, Y' ) ),
			'categories' => get_the_category_list( ', ', '', get_the_ID() ),
			'read_time'  => ( (int) ceil( str_word_count( wp_strip_all_tags( get_the_content() ) ) / 200 ) <= 0 ? 1 : (int) ceil( str_word_count( wp_strip_all_tags( get_the_content() ) ) / 200 ) ),
		);
	}

	$pagination = paginate_links(
		array(
			'base'      => str_replace( $big, '%#%', get_pagenum_link( $big ) ),
			'format'    => '?paged=%#%',
			'current'   => max( 1, $paged ),
			'total'     => (int) $latest_posts->max_num_pages,
			'prev_text' => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h16M9 17s-5-3.682-5-5 5-5 5-5" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
			'next_text' => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12H4m11 5s5-3.682 5-5-5-5-5-5" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		)
	);

	// Reset Post Data after the loop.
	wp_reset_postdata();
}

wp_interactivity_state(
	'blog-search',
	array(
		'results'     => $posts,
		'paged'       => $paged,
		'order'       => 'desc',
		'tag'         => '',
		'searchValue' => get_search_query(),
		'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
		'nonce'       => wp_create_nonce( 'myPlugin_nonce' ),
		'read_time'   => '',
		'posts_per_page' => $attributes['itemsPerPage'],
	),
);

$post_tags = get_tags(
	array(
		'hide_empty' => false,
	)
);

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => "$featured_post_class",
	)
);

$context = array(
	'results'        => $posts,
	'paged'          => $paged,
	'order'          => 'desc',
	'tagId'          => 0,
	'searchValue'    => get_search_query(),
	'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
	'nonce'          => wp_create_nonce( 'myPlugin_nonce' ),
	'posts_per_page' => $attributes['itemsPerPage'],
);
?>

<div <?php echo wp_kses_data( $wrapper_attributes ); ?> data-wp-interactive="blog-search" <?php echo wp_interactivity_data_wp_context( $context ); ?>>
	<div class="wpg-container">
		<?php
		if ( $attributes['toggleHeader'] ) {
			?>
			<div class="wpg-row-header">
				<h2 class="post__title"><?php echo esc_html( $attributes['title'] ); ?></h2>
				<p class="post__subtitle"><?php echo esc_html( $attributes['subtitle'] ); ?></p>
			</div>
		<?php } ?>

		<?php
		if ( $attributes['toggleFilters'] ) {
			?>
			<form id="filter-form" class="wpg-row-filter">
				<div class="wpg-row-category">
					<button type="button" class="filter-button" data-tag="all" data-tag-id="0" data-wp-on--click="actions.filterByTag" aria-label="View all posts">
						<?php echo esc_html( 'View all posts', 'interactivity-api' ); ?>
					</button>
					<?php
					if ( $post_tags ) {
						foreach ( $post_tags as $tag ) {
							?>
							<button type="button" class="filter-button" data-wp-on--click="actions.filterByTag"
								data-tag-id="<?php echo esc_attr( $tag->term_id ); ?>" data-tag="<?php echo esc_attr( $tag->slug ); ?>"
								aria-label="View <?php echo esc_attr( $tag->name ); ?>">
								<?php echo esc_html( $tag->name ); ?>
							</button>
							<?php
						}
					}
					?>
				</div>
				<div class="wpg-row-sort">
					<select id="sort-order" name="order" data-wp-on--change="actions.filterByOrder">
						<option value="desc"><?php esc_html_e( 'Descending', 'interactivity-api' ); ?></option>
						<option value="asc"><?php esc_html_e( 'Ascending', 'interactivity-api' ); ?></option>
					</select>
				</div>
			</form>
		<?php } ?>

		<div class="wpg-post-wrapper" data-posts_per_page="<?php echo absint( $attributes['itemsPerPage'] ); ?>">
			<div class="post-grid" id="post-grid">
				<template data-wp-each="state.results" data-wp-init="callbacks.initialize">
					<div class="post-item">
						<img class="post-featured-image" data-wp-bind--src="context.item.source_url" />
						<div class="post-content">

							<h3 class="post-title">
								<a data-wp-bind--href="context.item.link"
									data-wp-text="context.item.title.rendered"></a>
							</h3>
							<div class="post-excerpt" data-wp-text="context.item.excerpt.rendered"></div>
							<div class="meta-info">
								<span data-wp-text="context.item.author"></span>
								<span data-wp-text="state.getDate"></span>
								<span><span data-wp-text="context.item.read_time"></span> min read</span>
							</div>
						</div>
					</div>
				</template>
			</div>

			<?php if ( $items_per_page < $latest_posts->found_posts ) { ?>
				<?php if ( 'load-more' === $attributes['loadPosts'] ) { ?>
				<a class="wpg-blog-see-more" href="<?php the_permalink(); ?>">
					<?php esc_html_e( 'See more', 'interactivity-api' ); ?>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none"><path d="M21.338 13.352a.896.896 0 0 0 0-1.271l-5.1-5.104a.9.9 0 0 0-1.271 1.271l3.562 3.563-15.229.004c-.499 0-.9.4-.9.9 0 .498.401.9.9.9h15.229l-3.563 3.562a.9.9 0 0 0 1.271 1.271z" fill="#169206"/></svg>
				</a>
				<?php } ?>

				<?php if ( 'pagination' === $attributes['loadPosts'] ) { ?>
					<div class="wpg-row-pagination">
						<?php echo $pagination; ?>
					</div>
				<?php } ?>
			<?php } ?>
		</div>
	</div>
</div>