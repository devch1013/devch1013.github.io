import { error } from '@sveltejs/kit';

export function load({ params }) {
        return {
            title: params.slug,
            content: 'Welcome to our blog. Lorem ipsum dolor sit amet...'
        };

}