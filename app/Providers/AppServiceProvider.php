<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Connectors\ConnectionFactory;
use App\Database\PostgresConnector;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        // Override ConnectionFactory to use custom PostgreSQL connector
        // We use extend to wrap the existing factory
        $this->app->extend('db.factory', function ($factory, $app) {
            return new class($factory, $app) extends ConnectionFactory {
                protected $originalFactory;
                
                public function __construct($originalFactory, $app)
                {
                    $this->originalFactory = $originalFactory;
                    // Call parent constructor with app instance
                    parent::__construct($app);
                }
                
                public function createConnector(array $config)
                {
                    if (isset($config['driver']) && $config['driver'] === 'pgsql') {
                        return new PostgresConnector();
                    }
                    
                    return $this->originalFactory->createConnector($config);
                }
            };
        });
        
        // Also ensure the class binding uses our custom factory
        if (!$this->app->bound(ConnectionFactory::class)) {
            $this->app->singleton(ConnectionFactory::class, function ($app) {
                return $app->make('db.factory');
            });
        }
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
