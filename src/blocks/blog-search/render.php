<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="blog-search"
>
	<div class="wp-block-search__inside-wrapper">
		<h2><?php echo esc_html( $attributes['title'] ); ?></h2>
		<p><?php echo esc_html( $attributes['subtitle'] ); ?></p>
		<div class="wp-block-search__input-wrapper">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m14.584 14.583 3.75 3.75" stroke="#606060" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.667 9.167a7.5 7.5 0 1 0-15 0 7.5 7.5 0 0 0 15 0Z" stroke="#606060" stroke-width="1.25" stroke-linejoin="round"/></svg>
			<input
				class="wp-block-search__input"
				type="search"
				id="wpg-search-input"
				name="s"
				required
				autocomplete="off"
				placeholder="Search"
				data-wp-on--keyup="actions.keyup"
				data-wp-on--focus="actions.focus"
				data-wp-on--blur="actions.blur"
			/>
		</div>
	</div>
</div>
