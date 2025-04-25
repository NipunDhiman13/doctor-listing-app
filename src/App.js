import React, { useEffect, useState, useMemo } from "react";

// List of all specialties for filter panel and data-testid mapping
const SPECIALTIES = [
  "General Physician", "Dentist", "Dermatologist", "Paediatrician", "Gynaecologist",
  "ENT", "Diabetologist", "Cardiologist", "Physiotherapist", "Endocrinologist",
  "Orthopaedic", "Ophthalmologist", "Gastroenterologist", "Pulmonologist", "Psychiatrist",
  "Urologist", "Dietitian/Nutritionist", "Psychologist", "Sexologist", "Nephrologist",
  "Neurologist", "Oncologist", "Ayurveda", "Homeopath"
];

const CONSULTATION_TYPES = [
  { label: "Video Consult", value: "Video Consult" },
  { label: "In Clinic", value: "In Clinic" }
];

const SORT_OPTIONS = [
  { label: "Fees (Low to High)", value: "fees", testid: "sort-fees" },
  { label: "Experience (High to Low)", value: "experience", testid: "sort-experience" }
];

function specialtyTestId(s) {
  return `filter-specialty-${s.replace(/\//g, "-").replace(/\s/g, "-")}`;
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get("search") || "",
    consultation: params.get("consultation") || "",
    specialties: params.get("specialties") ? params.get("specialties").split(",") : [],
    sort: params.get("sort") || ""
  };
}

function setQueryParams({ search, consultation, specialties, sort }) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (consultation) params.set("consultation", consultation);
  if (specialties && specialties.length) params.set("specialties", specialties.join(","));
  if (sort) params.set("sort", sort);
  window.history.replaceState({}, "", `?${params.toString()}`);
}

function DoctorAvatar({ name, photo }) {
  if (photo) {
    return <img className="doctor-avatar" src={photo} alt={name} loading="lazy" />;
  }
  
  // Create initials for avatar
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "DR";
  
  return (
    <div className="doctor-avatar" style={{
      background: "#E0ECFF",
      color: "#2563eb",
      fontWeight: 600,
      fontSize: "1.1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {initials}
    </div>
  );
}

export default function App() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [consultation, setConsultation] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [sort, setSort] = useState("");

  // Autocomplete
  const [autocompleteInput, setAutocompleteInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load initial state from URL
  useEffect(() => {
    const params = getQueryParams();
    setSearch(params.search);
    setAutocompleteInput(params.search);
    setConsultation(params.consultation);
    setSpecialties(params.specialties);
    setSort(params.sort);
  }, []);

  // Fetch doctors data with improved handling
  useEffect(() => {
    setLoading(true);
    fetch("https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json")
      .then((res) => res.json())
      .then((data) => {
        // Map API data to consistent format
        setDoctors(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching doctor data:", error);
        setLoading(false);
      });
  }, []);

  // Update query params on filter change
  useEffect(() => {
    setQueryParams({ search, consultation, specialties, sort });
  }, [search, consultation, specialties, sort]);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const onPopState = () => {
      const params = getQueryParams();
      setSearch(params.search);
      setAutocompleteInput(params.search);
      setConsultation(params.consultation);
      setSpecialties(params.specialties);
      setSort(params.sort);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Autocomplete suggestions
  useEffect(() => {
    if (!autocompleteInput) {
      setSuggestions([]);
      return;
    }
    const matches = doctors
      .filter((d) =>
        d.name.toLowerCase().includes(autocompleteInput.toLowerCase())
      )
      .slice(0, 3);
    setSuggestions(matches);
  }, [autocompleteInput, doctors]);

  // Filtering and sorting - FIXED
  const filteredDoctors = useMemo(() => {
    let list = [...doctors]; // Create a copy to avoid mutating original data

    // Search filter
    if (search) {
      list = list.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Consultation type filter
    if (consultation) {
      list = list.filter((d) => {
        if (consultation === "Video Consult") return d.video_consult;
        if (consultation === "In Clinic") return d.in_clinic;
        return false;
      });
    }

    // Specialties filter - FIXED to work with specialities array of objects
    if (specialties.length) {
      list = list.filter((d) =>
        specialties.every((sp) =>
          d.specialities && d.specialities.some(s => s.name === sp)
        )
      );
    }

    // Sorting - FIXED to extract numbers from strings
    if (sort === "fees") {
      list = [...list].sort((a, b) => {
        const feeA = parseInt((a.fees || "0").replace(/[^\d]/g, "")) || 0;
        const feeB = parseInt((b.fees || "0").replace(/[^\d]/g, "")) || 0;
        return feeA - feeB;
      });
    } else if (sort === "experience") {
      list = [...list].sort((a, b) => {
        const expA = parseInt((a.experience || "0").replace(/[^\d]/g, "")) || 0;
        const expB = parseInt((b.experience || "0").replace(/[^\d]/g, "")) || 0;
        return expB - expA; // Descending order for experience
      });
    }

    return list;
  }, [doctors, search, consultation, specialties, sort]);

  // Handlers
  const handleSuggestionClick = (name) => {
    setSearch(name);
    setAutocompleteInput(name);
    setShowSuggestions(false);
  };

  const handleAutocompleteInput = (e) => {
    setAutocompleteInput(e.target.value);
    setShowSuggestions(true);
  };

  const handleAutocompleteKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearch(autocompleteInput);
      setShowSuggestions(false);
    }
  };

  const handleConsultationChange = (val) => {
    setConsultation(val);
  };

  const handleSpecialtyToggle = (sp) => {
    setSpecialties((prev) =>
      prev.includes(sp)
        ? prev.filter((s) => s !== sp)
        : [...prev, sp]
    );
  };

  const handleSortChange = (val) => {
    setSort(val);
  };

  return (
    <div className="container">
      <header>
        <h2>Doctor Listing</h2>
        <div className="autocomplete-header">
          <input
            data-testid="autocomplete-input"
            value={autocompleteInput}
            onChange={handleAutocompleteInput}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleAutocompleteKeyDown}
            placeholder="Search doctor by name"
            autoComplete="off"
          />
          <span className="search-icon">
            <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><line x1="16" y1="16" x2="13.5" y2="13.5"/></svg>
          </span>
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestion-dropdown">
              {suggestions.map((d) => (
                <div
                  data-testid="suggestion-item"
                  className="suggestion-item"
                  key={d.id}
                  onMouseDown={() => handleSuggestionClick(d.name)}
                >
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Filter Panel */}
        <aside className="filter-panel">
          {/* Consultation Mode */}
          <div>
            <div data-testid="filter-header-moc" className="filter-header">
              Consultation Mode
            </div>
            {CONSULTATION_TYPES.map((ct) => (
              <label key={ct.value}>
                <input
                  type="radio"
                  name="consultation"
                  data-testid={
                    ct.value === "Video Consult"
                      ? "filter-video-consult"
                      : "filter-in-clinic"
                  }
                  checked={consultation === ct.value}
                  onChange={() => handleConsultationChange(ct.value)}
                />
                {ct.label}
              </label>
            ))}
          </div>

          {/* Specialties */}
          <div>
            <div data-testid="filter-header-speciality" className="filter-header">
              Speciality
            </div>
            <div className="specialty-list">
              {SPECIALTIES.map((sp) => (
                <label key={sp}>
                  <input
                    type="checkbox"
                    data-testid={specialtyTestId(sp)}
                    checked={specialties.includes(sp)}
                    onChange={() => handleSpecialtyToggle(sp)}
                  />
                  {sp}
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <div data-testid="filter-header-sort" className="filter-header">
              Sort
            </div>
            {SORT_OPTIONS.map((so) => (
              <label key={so.value}>
                <input
                  type="radio"
                  name="sort"
                  data-testid={so.testid}
                  checked={sort === so.value}
                  onChange={() => handleSortChange(so.value)}
                />
                {so.label}
              </label>
            ))}
          </div>
        </aside>

        {/* Doctor List */}
        <section className="doctor-list">
          {loading ? (
            <div>Loading doctors...</div>
          ) : filteredDoctors.length === 0 ? (
            <div>No doctors found.</div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div className="doctor-card" data-testid="doctor-card" key={doctor.id}>
                <DoctorAvatar name={doctor.name} photo={doctor.photo} />
                <div className="doctor-info">
                  <div data-testid="doctor-name" className="doctor-name">
                    {doctor.name}
                  </div>
                  
                  {/* FIXED: Correctly display specialities from API format */}
                  <div data-testid="doctor-specialty" className="doctor-specialty">
                    {doctor.specialities && doctor.specialities.length > 0
                      ? doctor.specialities.map(s => s.name).join(", ")
                      : "No specialties listed"}
                  </div>
                  
                  <div data-testid="doctor-experience" className="doctor-experience">
                    {doctor.experience}
                  </div>
                  
                  <div data-testid="doctor-fee" className="doctor-fee">
                    {doctor.fees}
                  </div>
                  
                  {/* Additional details */}
                  {doctor.languages && doctor.languages.length > 0 && (
                    <div className="doctor-languages">
                      <span className="detail-label">Languages:</span> {doctor.languages.join(", ")}
                    </div>
                  )}
                  
                  {doctor.doctor_introduction && (
                    <div className="doctor-introduction">
                      {doctor.doctor_introduction}
                    </div>
                  )}
                  
                  {doctor.clinic && (
                    <div className="doctor-clinic">
                      <span className="detail-label">Clinic:</span> {doctor.clinic.name}
                      {doctor.clinic.address && (
                        <div className="clinic-address">
                          {doctor.clinic.address.address_line1}, 
                          {doctor.clinic.address.locality}, 
                          {doctor.clinic.address.city}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="consultation-options">
                    {doctor.video_consult && <span className="consult-badge video">Video Consult</span>}
                    {doctor.in_clinic && <span className="consult-badge clinic">In Clinic</span>}
                  </div>
                  
                  <button className="book-btn">Book Appointment</button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
