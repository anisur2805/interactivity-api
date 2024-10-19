<?php
/**
 * Plugin Name:       Interactivity API
 * Description:       Interactivity API example with Default Post Type.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            Anisur Rahman
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       interactivity-api
 *
 * @package interactivity-api
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Register Blocks
function interactivity_api_block_init() {
	register_block_type( __DIR__ . '/build/blocks/blog' );
	register_block_type( __DIR__ . '/build/blocks/blog-search' );
}
add_action( 'init', 'interactivity_api_block_init' );

/**
 * Enqueue scripts and styles.
 *
 * @return void
 */
function interactivity_api_enqueue_scripts() {
	/**
	 * Enqueue non-module scripts.
	 */
	wp_enqueue_script( 'wp-api-fetch' );
}
add_action( 'wp_enqueue_scripts', 'interactivity_api_enqueue_scripts' );
