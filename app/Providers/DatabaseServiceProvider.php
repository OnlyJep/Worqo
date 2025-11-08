<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Doctrine\DBAL\Types\Type;
use App\Database\PostgresConnector;
use Illuminate\Database\Connectors\ConnectionFactory;

class DatabaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        // Override connection factory after Laravel's DatabaseServiceProvider registers it
        // This ensures our custom PostgreSQL connector with UTF8 encoding is used
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        if (!Type::hasType('enum')) {
            Type::addType('enum', 'Doctrine\DBAL\Types\StringType');
        }
        
        // Force override the connection factory in boot() to ensure it runs after Laravel's DatabaseServiceProvider
        // This replaces any existing factory with our custom one that uses UTF8 encoding
        $this->app->singleton('db.factory', function ($app) {
            return new class($app) extends ConnectionFactory {
                public function createConnector(array $config)
                {
                    if (isset($config['driver']) && $config['driver'] === 'pgsql') {
                        return new PostgresConnector();
                    }
                    
                    return parent::createConnector($config);
                }
            };
        }, true); // true = force override even if already bound
    }
}
