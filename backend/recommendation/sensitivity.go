package recommendation

import "fmt"

type Scenario struct {
	Key     string   `json:"key"`
	Name    string   `json:"name"`
	Weights Weights  `json:"weights"`
	Results []Result `json:"results"`
}

type WinnerFrequency struct {
	CarID int64  `json:"car_id"`
	Name  string `json:"name"`
	Wins  int    `json:"wins"`
}

type SensitivityResponse struct {
	Alternatives int               `json:"alternatives"`
	Scenarios    []Scenario        `json:"scenarios"`
	Winners      []WinnerFrequency `json:"winners"`
}

func AnalyzeSensitivity(
	cars []Car,
	prefs Preferences,
) (SensitivityResponse, error) {
	definitions := []struct {
		key     string
		name    string
		weights Weights
	}{
		{
			"balanced", "Seimbang",
			Weights{25, 25, 25, 25},
		},
		{
			"price", "Prioritas Harga",
			Weights{60, 15, 15, 10},
		},
		{
			"family", "Prioritas Keluarga",
			Weights{20, 15, 50, 15},
		},
		{
			"year", "Prioritas Tahun",
			Weights{20, 55, 15, 10},
		},
	}

	output := SensitivityResponse{
		Scenarios: make([]Scenario, 0, len(definitions)),
		Winners:   make([]WinnerFrequency, 0),
	}

	wins := make(map[int64]*WinnerFrequency)

	for _, definition := range definitions {
		scenarioPrefs := prefs
		scenarioPrefs.Weights = definition.weights

		calculated, err := Calculate(cars, scenarioPrefs)
		if err != nil {
			return SensitivityResponse{}, fmt.Errorf(
				"skenario %s: %w",
				definition.key,
				err,
			)
		}

		output.Alternatives = calculated.Alternatives

		output.Scenarios = append(output.Scenarios, Scenario{
			Key:     definition.key,
			Name:    definition.name,
			Weights: calculated.Weights,
			Results: calculated.Results,
		})

		if len(calculated.Results) == 0 {
			continue
		}

		winner := calculated.Results[0].Car

		if _, exists := wins[winner.ID]; !exists {
			wins[winner.ID] = &WinnerFrequency{
				CarID: winner.ID,
				Name:  winner.Brand + " " + winner.Model,
			}
		}

		wins[winner.ID].Wins++
	}

	// Susunan pemenang dibuat deterministik berdasarkan
	// urutan kemunculannya dalam skenario.
	seen := make(map[int64]bool)

	for _, scenario := range output.Scenarios {
		if len(scenario.Results) == 0 {
			continue
		}

		id := scenario.Results[0].Car.ID

		if !seen[id] {
			output.Winners = append(output.Winners, *wins[id])
			seen[id] = true
		}
	}

	return output, nil
}
