const mix = require('laravel-mix');



mix.js('resources/js/app.js', 'public/js')
   .react() // Enables React/JSX support
   .sass('resources/sass/app.scss', 'public/css');