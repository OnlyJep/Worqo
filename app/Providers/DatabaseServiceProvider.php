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
        
        // CRITICAL: Override the connection factory in boot() AFTER Laravel's DatabaseServiceProvider
        // This ensures our custom PostgreSQL connector with UTF8 encoding is used
        // We need to forget the existing instance first, then rebind
        if ($this->app->bound('db.factory')) {
            $this->app->forgetInstance('db.factory');
        }
        
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
        });
        
        // Also ensure ConnectionFactory class binding uses our factory
        $this->app->bind(ConnectionFactory::class, function ($app) {
            return $app->make('db.factory');
        });
    }
}
