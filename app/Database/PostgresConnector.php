<?php

namespace App\Database;

use Illuminate\Database\Connectors\PostgresConnector as BasePostgresConnector;
use PDO;

class PostgresConnector extends BasePostgresConnector
{
    /**
     * Create a new PDO connection.
     *
     * @param  string  $dsn
     * @param  array  $config
     * @param  array  $options
     * @return \PDO
     */
    public function createConnection($dsn, array $config, array $options)
    {
        // Create the connection
        $connection = parent::createConnection($dsn, $config, $options);
        
        // Immediately set UTF8 encoding after connection
        // PostgreSQL doesn't support utf8mb4
        try {
            $connection->exec("SET client_encoding TO 'UTF8'");
        } catch (\PDOException $e) {
            // Try alternative method
            try {
                $stmt = $connection->prepare("SET client_encoding TO 'UTF8'");
                $stmt->execute();
            } catch (\PDOException $e2) {
                // Log but continue
                error_log("Warning: Could not set PostgreSQL encoding: " . $e2->getMessage());
            }
        }
        
        return $connection;
    }

    /**
     * Create a new database connection.
     *
     * @param  array  $config
     * @return \PDO
     */
    public function connect(array $config)
    {
        // Get the connection
        $connection = parent::connect($config);
        
        // Force UTF8 encoding - PostgreSQL doesn't support utf8mb4
        // This must happen AFTER parent::connect() which calls configureEncoding
        // But we override configureEncoding to do nothing, then set UTF8 here
        try {
            $connection->exec("SET client_encoding TO 'UTF8'");
        } catch (\PDOException $e) {
            // If that fails, try prepare/execute
            try {
                $stmt = $connection->prepare("SET client_encoding TO 'UTF8'");
                $stmt->execute();
            } catch (\PDOException $e2) {
                error_log("Warning: Could not set PostgreSQL encoding: " . $e2->getMessage());
            }
        }
        
        return $connection;
    }

    /**
     * Set the connection character set and collation.
     * OVERRIDE: Don't set encoding here - we do it in connect() method
     * This prevents the utf8mb4 error from being set
     *
     * @param  \PDO  $connection
     * @param  array  $config
     * @return void
     */
    protected function configureEncoding($connection, $config)
    {
        // Do nothing here - we'll set UTF8 in connect() method instead
        // This prevents Laravel from trying to set utf8mb4 which PostgreSQL doesn't support
    }
}


