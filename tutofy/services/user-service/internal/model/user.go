package model

type User struct {
	ID    string
	Email string
	Name  string
	Role  string
}

type TutorProfile struct {
	ID              string
	Name            string
	Email           string
	Bio             string
	Age             int32
	Location        string
	PhotoURL        string
	Subjects        string // JSON-encoded []string, e.g. `["Math","Physics"]`
	ExperienceYears int32
}
