<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Doctrine\DBAL\Types\Type;
use App\Database\PostgresConnector;

class DatabaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        // Override PostgreSQL connector factory to use our custom connector
        // This ensures UTF8 encoding is used instead of utf8mb4
        $this->app->bind(
            \Illuminate\Database\Connectors\ConnectionFactory::class,
            function ($app) {
                return new class($app) extends \Illuminate\Database\Connectors\ConnectionFactory {
                    protected function createConnector(array $config)
                    {
                        if (!isset($config['driver'])) {
                            throw new \InvalidArgumentException('A driver must be specified.');
                        }

                        if ($config['driver'] === 'pgsql') {
                            return new PostgresConnector();
                        }

                        return parent::createConnector($config);
                    }
                };
            }
        );
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
    }
}
