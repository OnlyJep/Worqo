<?php

namespace App\Database;

use Illuminate\Database\Connectors\PostgresConnector as BasePostgresConnector;

class PostgresConnector extends BasePostgresConnector
{
    /**
     * Set the connection character set and collation.
     *
     * @param  \PDO  $connection
     * @param  array  $config
     * @return void
     */
    protected function configureEncoding($connection, $config)
    {
        if (! isset($config['charset'])) {
            return;
        }

        // PostgreSQL only supports UTF8, not utf8mb4
        $charset = $config['charset'];
        if ($charset === 'utf8mb4' || $charset === 'utf8') {
            $charset = 'UTF8';
        }

        $connection->prepare("set client_encoding to '{$charset}'")->execute();
    }
}

