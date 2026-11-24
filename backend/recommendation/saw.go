package recommendation

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
)

// ==========================================
// DATA MOBIL
// ==========================================

type Car struct {
	ID           int64  `json:"id"`
	Brand        string `json:"brand"`
	Model        string `json:"model"`
	Year         int    `json:"year"`
	Price        int64  `json:"price"`
	Transmission string `json:"transmission"`
	FuelType     string `json:"fuel_type"`
	Seats        int    `json:"seats"`
	Description  string `json:"description"`
	Status       string `json:"status"`
	ImageURL     string `json:"image_url"`
}

// ==========================================
// KRITERIA DAN PREFERENSI
// ==========================================

type Weights struct {
	Price        float64 `json:"price"`
	Year         float64 `json:"year"`
	Seats        float64 `json:"seats"`
	Transmission float64 `json:"transmission"`
}

type Preferences struct {
	MaxBudget    int64   `json:"max_budget"`
	MinSeats     int     `json:"min_seats"`
	Transmission string  `json:"transmission"`
	Weights      Weights `json:"weights"`
}

type Values struct {
	Price        float64 `json:"price"`
	Year         float64 `json:"year"`
	Seats        float64 `json:"seats"`
	Transmission float64 `json:"transmission"`
}

// Nilai pembanding yang digunakan dalam normalisasi.
type NormalizationBasis struct {
	MinPrice int64 `json:"min_price"`
	MaxYear  int   `json:"max_year"`
	MaxSeats int   `json:"max_seats"`
}

// ==========================================
// HASIL PERHITUNGAN
// ==========================================

type Result struct {
	Rank          int      `json:"rank"`
	Car           Car      `json:"car"`
	Raw           Values   `json:"raw"`
	Normalized    Values   `json:"normalized"`
	Contributions Values   `json:"contributions"`
	Score         float64  `json:"score"`
	Reasons       []string `json:"reasons"`
}

type Response struct {
	Weights            Weights            `json:"weights"`
	Preferences        Preferences        `json:"preferences"`
	Alternatives       int                `json:"alternatives"`
	NormalizationBasis NormalizationBasis `json:"normalization_basis"`
	Results            []Result           `json:"results"`
}

// ==========================================
// TRANSMISSION SCORING
// ==========================================

// Skor kesesuaian transmisi:
// 1.0 = sesuai atau tidak ada preferensi
// 0.5 = tidak sesuai
//
// Automatic dan CVT diperlakukan berbeda
// sesuai aturan model SAW AutoDrive saat ini.
func transmissionScore(
	carTransmission string,
	preferredTransmission string,
) float64 {
	carTransmission = strings.ToLower(
		strings.TrimSpace(carTransmission),
	)

	preferredTransmission = strings.ToLower(
		strings.TrimSpace(preferredTransmission),
	)

	if preferredTransmission == "any" ||
		preferredTransmission == "" {
		return 1.0
	}

	if carTransmission == preferredTransmission {
		return 1.0
	}

	return 0.5
}

// ==========================================
// VALIDASI BOBOT
// ==========================================

func validateWeights(w Weights) error {
	values := []float64{
		w.Price,
		w.Year,
		w.Seats,
		w.Transmission,
	}

	total := 0.0

	for _, value := range values {
		if math.IsNaN(value) ||
			math.IsInf(value, 0) ||
			value < 0 {
			return errors.New(
				"Setiap bobot harus berupa angka nonnegatif yang valid",
			)
		}

		total += value
	}

	if total <= 0 || math.IsInf(total, 0) {
		return errors.New(
			"Total bobot harus lebih dari nol",
		)
	}

	return nil
}

// ==========================================
// NORMALISASI BOBOT
// ==========================================

func normalizeWeights(w Weights) Weights {
	total := w.Price +
		w.Year +
		w.Seats +
		w.Transmission

	return Weights{
		Price:        w.Price / total,
		Year:         w.Year / total,
		Seats:        w.Seats / total,
		Transmission: w.Transmission / total,
	}
}

// ==========================================
// VALIDASI PREFERENSI
// ==========================================

func validatePreferences(prefs Preferences) error {
	if prefs.MaxBudget < 0 {
		return errors.New(
			"Anggaran tidak boleh negatif",
		)
	}

	if prefs.MinSeats < 0 || prefs.MinSeats > 100 {
		return errors.New(
			"Jumlah kursi minimum harus antara 0 dan 100",
		)
	}

	if err := validateWeights(prefs.Weights); err != nil {
		return err
	}

	transmission := strings.ToLower(
		strings.TrimSpace(prefs.Transmission),
	)

	switch transmission {
	case "", "any", "manual", "automatic", "cvt":
		return nil
	default:
		return errors.New(
			"Preferensi transmisi tidak valid",
		)
	}
}

// ==========================================
// FILTER ALTERNATIF
// ==========================================

func filterEligibleCars(
	cars []Car,
	prefs Preferences,
) []Car {
	filtered := make([]Car, 0, len(cars))

	for _, car := range cars {
		if strings.ToLower(strings.TrimSpace(car.Status)) !=
			"available" {
			continue
		}

		if car.Price <= 0 ||
			car.Year < 1900 ||
			car.Year > 2100 ||
			car.Seats <= 0 ||
			car.Seats > 100 {
			continue
		}

		if prefs.MaxBudget > 0 &&
			car.Price > prefs.MaxBudget {
			continue
		}

		if prefs.MinSeats > 0 &&
			car.Seats < prefs.MinSeats {
			continue
		}

		filtered = append(filtered, car)
	}

	return filtered
}

// ==========================================
// NILAI PEMBANDING NORMALISASI
// ==========================================

func getNormalizationBasis(
	cars []Car,
) NormalizationBasis {
	if len(cars) == 0 {
		return NormalizationBasis{}
	}

	basis := NormalizationBasis{
		MinPrice: cars[0].Price,
		MaxYear:  cars[0].Year,
		MaxSeats: cars[0].Seats,
	}

	for _, car := range cars {
		if car.Price < basis.MinPrice {
			basis.MinPrice = car.Price
		}

		if car.Year > basis.MaxYear {
			basis.MaxYear = car.Year
		}

		if car.Seats > basis.MaxSeats {
			basis.MaxSeats = car.Seats
		}
	}

	return basis
}

// ==========================================
// PENJELASAN HASIL
// ==========================================

func explainResult(
	car Car,
	prefs Preferences,
	raw Values,
	normalized Values,
	contributions Values,
	weights Weights,
	basis NormalizationBasis,
) []string {
	reasons := make([]string, 0, 5)

	if weights.Price > 0 {
		if car.Price == basis.MinPrice {
			reasons = append(
				reasons,
				"Harga kendaraan merupakan yang paling rendah di antara alternatif yang memenuhi syarat.",
			)
		} else {
			reasons = append(
				reasons,
				fmt.Sprintf(
					"Nilai harga ternormalisasi %.4f dengan kontribusi skor %.4f.",
					normalized.Price,
					contributions.Price,
				),
			)
		}
	}

	if weights.Year > 0 {
		if car.Year == basis.MaxYear {
			reasons = append(
				reasons,
				"Tahun produksi termasuk yang paling baru di antara alternatif yang memenuhi syarat.",
			)
		} else {
			reasons = append(
				reasons,
				fmt.Sprintf(
					"Tahun produksi %d dibandingkan dengan tahun tertinggi %d menghasilkan normalisasi %.4f.",
					car.Year,
					basis.MaxYear,
					normalized.Year,
				),
			)
		}
	}

	if weights.Seats > 0 {
		if car.Seats == basis.MaxSeats {
			reasons = append(
				reasons,
				"Kapasitas kursi merupakan yang terbesar di antara alternatif yang memenuhi syarat.",
			)
		} else {
			reasons = append(
				reasons,
				fmt.Sprintf(
					"Kapasitas %d kursi dibandingkan dengan kapasitas terbesar %d kursi menghasilkan normalisasi %.4f.",
					car.Seats,
					basis.MaxSeats,
					normalized.Seats,
				),
			)
		}
	}

	if weights.Transmission > 0 {
		if prefs.Transmission == "any" {
			reasons = append(
				reasons,
				"Semua transmisi dianggap sesuai karena pembeli tidak menetapkan preferensi transmisi.",
			)
		} else if raw.Transmission == 1 {
			reasons = append(
				reasons,
				"Transmisi kendaraan sesuai dengan preferensi pembeli.",
			)
		} else {
			reasons = append(
				reasons,
				"Transmisi kendaraan berbeda dari preferensi sehingga memperoleh skor kecocokan 0,5.",
			)
		}
	}

	return reasons
}

// ==========================================
// PERHITUNGAN UTAMA SAW
// ==========================================

func Calculate(
	cars []Car,
	prefs Preferences,
) (Response, error) {

	// ------------------------------------------
	// 1. Validasi input
	// ------------------------------------------

	if err := validatePreferences(prefs); err != nil {
		return Response{}, err
	}

	prefs.Transmission = strings.ToLower(
		strings.TrimSpace(prefs.Transmission),
	)

	if prefs.Transmission == "" {
		prefs.Transmission = "any"
	}

	// ------------------------------------------
	// 2. Normalisasi bobot
	// ------------------------------------------

	weights := normalizeWeights(prefs.Weights)
	prefs.Weights = weights

	response := Response{
		Weights:     weights,
		Preferences: prefs,
		Results:     make([]Result, 0),
	}

	// ------------------------------------------
	// 3. Filter mobil yang memenuhi persyaratan
	// ------------------------------------------

	filtered := filterEligibleCars(cars, prefs)

	response.Alternatives = len(filtered)

	if len(filtered) == 0 {
		return response, nil
	}

	// ------------------------------------------
	// 4. Tentukan pembanding normalisasi
	// ------------------------------------------

	basis := getNormalizationBasis(filtered)
	response.NormalizationBasis = basis

	// ------------------------------------------
	// 5. Hitung normalisasi dan kontribusi
	// ------------------------------------------

	for _, car := range filtered {
		raw := Values{
			Price: float64(car.Price),
			Year:  float64(car.Year),
			Seats: float64(car.Seats),
			Transmission: transmissionScore(
				car.Transmission,
				prefs.Transmission,
			),
		}

		// C1: Harga = cost
		// C2: Tahun = benefit
		// C3: Kursi = benefit
		// C4: Transmisi = benefit
		//
		// Skor transmisi sudah berada
		// pada skala 0 sampai 1.
		normalized := Values{
			Price: float64(basis.MinPrice) /
				raw.Price,

			Year: raw.Year /
				float64(basis.MaxYear),

			Seats: raw.Seats /
				float64(basis.MaxSeats),

			Transmission: raw.Transmission,
		}

		contributions := Values{
			Price: normalized.Price *
				weights.Price,

			Year: normalized.Year *
				weights.Year,

			Seats: normalized.Seats *
				weights.Seats,

			Transmission: normalized.Transmission *
				weights.Transmission,
		}

		score := contributions.Price +
			contributions.Year +
			contributions.Seats +
			contributions.Transmission

		reasons := explainResult(
			car,
			prefs,
			raw,
			normalized,
			contributions,
			weights,
			basis,
		)

		response.Results = append(
			response.Results,
			Result{
				Car:           car,
				Raw:           raw,
				Normalized:    normalized,
				Contributions: contributions,
				Score:         score,
				Reasons:       reasons,
			},
		)
	}

	// ------------------------------------------
	// 6. Urutkan peringkat
	// ------------------------------------------

	sort.SliceStable(
		response.Results,
		func(i, j int) bool {
			a := response.Results[i]
			b := response.Results[j]

			// Skor lebih besar = lebih baik.
			if math.Abs(a.Score-b.Score) > 1e-12 {
				return a.Score > b.Score
			}

			// Jika skor sama, harga lebih murah
			// diprioritaskan sebagai tie-breaker.
			if a.Car.Price != b.Car.Price {
				return a.Car.Price < b.Car.Price
			}

			return a.Car.ID < b.Car.ID
		},
	)

	// ------------------------------------------
	// 7. Tetapkan nomor peringkat
	// ------------------------------------------

	for i := range response.Results {
		response.Results[i].Rank = i + 1
	}

	return response, nil
}
