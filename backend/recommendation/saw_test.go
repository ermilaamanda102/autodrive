package recommendation

import (
	"math"
	"testing"
)

func testCars() []Car {
	return []Car{
		{
			ID:           1,
			Brand:        "Toyota",
			Model:        "Avanza",
			Year:         2020,
			Price:        160000000,
			Seats:        7,
			Transmission: "Automatic",
			Status:       "available",
		},
		{
			ID:           2,
			Brand:        "Honda",
			Model:        "Mobilio",
			Year:         2020,
			Price:        175000000,
			Seats:        7,
			Transmission: "Automatic",
			Status:       "available",
		},
		{
			ID:           3,
			Brand:        "Toyota",
			Model:        "Vios",
			Year:         2026,
			Price:        200000000,
			Seats:        4,
			Transmission: "Manual",
			Status:       "available",
		},
	}
}

func testPreferences() Preferences {
	return Preferences{
		MaxBudget:    0,
		MinSeats:     0,
		Transmission: "any",
		Weights: Weights{
			Price:        40,
			Year:         25,
			Seats:        20,
			Transmission: 15,
		},
	}
}

func assertAlmostEqual(
	t *testing.T,
	actual float64,
	expected float64,
) {
	t.Helper()

	if math.Abs(actual-expected) > 1e-9 {
		t.Fatalf(
			"expected %.12f, got %.12f",
			expected,
			actual,
		)
	}
}

func TestSAWManualCalculation(t *testing.T) {
	result, err := Calculate(
		testCars(),
		testPreferences(),
	)

	if err != nil {
		t.Fatal(err)
	}

	if result.Alternatives != 3 {
		t.Fatalf(
			"expected 3 alternatives, got %d",
			result.Alternatives,
		)
	}

	if result.NormalizationBasis.MinPrice != 160000000 {
		t.Fatal("minimum price incorrect")
	}

	if result.NormalizationBasis.MaxYear != 2026 {
		t.Fatal("maximum year incorrect")
	}

	if result.NormalizationBasis.MaxSeats != 7 {
		t.Fatal("maximum seats incorrect")
	}

	// Manual:
	// Avanza =
	// 0.40 * (160/160) +
	// 0.25 * (2020/2026) +
	// 0.20 * (7/7) +
	// 0.15 * 1
	expectedAvanza :=
		0.40 +
			0.25*(2020.0/2026.0) +
			0.20 +
			0.15

	if result.Results[0].Car.ID != 1 {
		t.Fatalf(
			"expected Avanza rank 1, got ID %d",
			result.Results[0].Car.ID,
		)
	}

	assertAlmostEqual(
		t,
		result.Results[0].Score,
		expectedAvanza,
	)

	assertAlmostEqual(
		t,
		result.Results[0].Normalized.Seats,
		1,
	)

	// Jumlah kontribusi harus sama dengan skor.
	first := result.Results[0]

	sum := first.Contributions.Price +
		first.Contributions.Year +
		first.Contributions.Seats +
		first.Contributions.Transmission

	assertAlmostEqual(t, first.Score, sum)
}

func TestSeatNormalization(t *testing.T) {
	result, err := Calculate(
		testCars(),
		testPreferences(),
	)

	if err != nil {
		t.Fatal(err)
	}

	for _, item := range result.Results {
		if item.Car.ID == 3 {
			assertAlmostEqual(
				t,
				item.Normalized.Seats,
				4.0/7.0,
			)
			return
		}
	}

	t.Fatal("Vios not found in results")
}

func TestBudgetFilter(t *testing.T) {
	prefs := testPreferences()
	prefs.MaxBudget = 170000000

	result, err := Calculate(testCars(), prefs)

	if err != nil {
		t.Fatal(err)
	}

	if result.Alternatives != 1 {
		t.Fatalf(
			"expected 1 car, got %d",
			result.Alternatives,
		)
	}

	if result.Results[0].Car.ID != 1 {
		t.Fatal("budget filter returned wrong car")
	}
}

func TestMinimumSeatsFilter(t *testing.T) {
	prefs := testPreferences()
	prefs.MinSeats = 7

	result, err := Calculate(testCars(), prefs)

	if err != nil {
		t.Fatal(err)
	}

	if result.Alternatives != 2 {
		t.Fatalf(
			"expected 2 cars, got %d",
			result.Alternatives,
		)
	}

	for _, item := range result.Results {
		if item.Car.Seats < 7 {
			t.Fatal("car below minimum seats included")
		}
	}
}

func TestTransmissionPreference(t *testing.T) {
	prefs := testPreferences()
	prefs.Transmission = "manual"

	result, err := Calculate(testCars(), prefs)

	if err != nil {
		t.Fatal(err)
	}

	for _, item := range result.Results {
		if item.Car.ID == 3 {
			assertAlmostEqual(
				t,
				item.Normalized.Transmission,
				1,
			)
		} else {
			assertAlmostEqual(
				t,
				item.Normalized.Transmission,
				0.5,
			)
		}
	}
}

func TestInvalidWeights(t *testing.T) {
	prefs := testPreferences()
	prefs.Weights = Weights{}

	_, err := Calculate(testCars(), prefs)

	if err == nil {
		t.Fatal("expected invalid weights error")
	}
}

func TestSoldCarsExcluded(t *testing.T) {
	cars := testCars()
	cars[0].Status = "sold"

	result, err := Calculate(
		cars,
		testPreferences(),
	)

	if err != nil {
		t.Fatal(err)
	}

	for _, item := range result.Results {
		if item.Car.ID == 1 {
			t.Fatal("sold car included")
		}
	}
}

func TestEmptyResults(t *testing.T) {
	prefs := testPreferences()
	prefs.MaxBudget = 1000000

	result, err := Calculate(
		testCars(),
		prefs,
	)

	if err != nil {
		t.Fatal(err)
	}

	if result.Alternatives != 0 {
		t.Fatal("expected zero alternatives")
	}

	if len(result.Results) != 0 {
		t.Fatal("expected empty results")
	}
}

func TestReasonsPresent(t *testing.T) {
	result, err := Calculate(
		testCars(),
		testPreferences(),
	)

	if err != nil {
		t.Fatal(err)
	}

	for _, item := range result.Results {
		if len(item.Reasons) == 0 {
			t.Fatal("recommendation reasons missing")
		}
	}
}

func TestWeightsNormalized(t *testing.T) {
	result, err := Calculate(
		testCars(),
		testPreferences(),
	)

	if err != nil {
		t.Fatal(err)
	}

	assertAlmostEqual(
		t,
		result.Weights.Price,
		0.4,
	)

	assertAlmostEqual(
		t,
		result.Weights.Year,
		0.25,
	)

	assertAlmostEqual(
		t,
		result.Weights.Seats,
		0.2,
	)

	assertAlmostEqual(
		t,
		result.Weights.Transmission,
		0.15,
	)
}
