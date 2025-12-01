<?php

namespace App\Services;

class PricingService
{
    /**
     * Price per page cache.
     */
    protected array $priceCache = [];

    /**
     * Get price per page for a given color mode.
     */
    public function getPricePerPage(string $colorMode): float
    {
        if (isset($this->priceCache[$colorMode])) {
            return $this->priceCache[$colorMode];
        }

        $price = match ($colorMode) {
            'bw' => (float) config('printing.prices.black_and_white', 2.00),
            'grayscale' => (float) config('printing.prices.grayscale', 3.00),
            'color' => (float) config('printing.prices.color', 5.00),
            default => (float) config('printing.prices.black_and_white', 2.00),
        };

        $this->priceCache[$colorMode] = $price;

        return $price;
    }

    /**
     * Calculate total cost for a print job.
     */
    public function calculateCost(int $pages, int $copies, string $colorMode): float
    {
        $pricePerPage = $this->getPricePerPage($colorMode);

        return round($pricePerPage * $pages * $copies, 2);
    }

    /**
     * Get all pricing information.
     */
    public function getAllPrices(): array
    {
        return [
            'bw' => $this->getPricePerPage('bw'),
            'grayscale' => $this->getPricePerPage('grayscale'),
            'color' => $this->getPricePerPage('color'),
        ];
    }

    /**
     * Get pricing breakdown for a print job.
     */
    public function getBreakdown(int $pages, int $copies, string $colorMode): array
    {
        $pricePerPage = $this->getPricePerPage($colorMode);
        $totalPages = $pages * $copies;
        $totalCost = $this->calculateCost($pages, $copies, $colorMode);

        return [
            'cost' => $totalCost,
            'price_per_page' => $pricePerPage,
            'total_pages' => $totalPages,
            'color_mode' => $colorMode,
            'pages' => $pages,
            'copies' => $copies,
        ];
    }
}
