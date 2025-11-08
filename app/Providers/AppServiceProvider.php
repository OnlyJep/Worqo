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
        // This MUST be registered before DatabaseServiceProvider loads
        // to ensure UTF8 encoding is used instead of utf8mb4
        // Laravel uses 'db.factory' as the service name for ConnectionFactory
        $this->app->singleton('db.factory', function ($app) {
            return new class($app) extends ConnectionFactory {
                protected function createConnector(array $config)
                {
                    if (isset($config['driver']) && $config['driver'] === 'pgsql') {
                        return new PostgresConnector();
                    }
                    
                    return parent::createConnector($config);
                }
            };
        });
        
        // Also bind the class directly
        $this->app->bind(ConnectionFactory::class, function ($app) {
            return $app->make('db.factory');
        });
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
