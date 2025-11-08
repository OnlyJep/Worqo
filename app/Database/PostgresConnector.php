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
     * Set the connection character set and collation.
     *
     * @param  \PDO  $connection
     * @param  array  $config
     * @return void
     */
    protected function configureEncoding($connection, $config)
    {
        // PostgreSQL only supports UTF8, not utf8mb4
        // Always set UTF8 encoding for PostgreSQL regardless of config
        try {
            $connection->exec("SET client_encoding TO 'UTF8'");
        } catch (\PDOException $e) {
            // If setting encoding fails, try with prepare/execute
            try {
                $stmt = $connection->prepare("SET client_encoding TO 'UTF8'");
                $stmt->execute();
            } catch (\PDOException $e2) {
                // If both fail, log but continue (encoding might already be set)
                error_log("Warning: Could not set PostgreSQL client encoding: " . $e2->getMessage());
            }
        }
    }
}

