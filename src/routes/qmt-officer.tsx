import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  ArrowLeft,
  UserCheck,
  Mail,
  Phone,
  Star,
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import avatar1 from "@/assets/doctors/avatar-1.jpg";
import avatar2 from "@/assets/doctors/avatar-2.jpg";
import avatar3 from "@/assets/doctors/avatar-3.jpg";
import avatar4 from "@/assets/doctors/avatar-4.jpg";
import avatar5 from "@/assets/doctors/avatar-5.jpg";
import avatar6 from "@/assets/doctors/avatar-6.jpg";

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6];

export const Route = createFileRoute("/qmt-officer")({
  head: () => ({
    meta: [
      { title: "QMT Officer | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Browse Quality Management Team (QMT) officers at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "QMT Officer | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Browse Quality Management Team (QMT) officers at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: QmtOfficerPage,
});

const officers = [
  {
    name: "Dr. Alemu Bekele",
    specialty: "Internal Medicine",
    dept: "Internal Medicine",
    exp: 14,
    rating: 4.8,
    status: "Active",
    patients: 1240,
    email: "alemu.b@alert.et",
    phone: "+251 911 01 0201",
    image: avatar1,
  },
  {
    name: "Dr. Sara Tadesse",
    specialty: "Pediatrics",
    dept: "Pediatrics",
    exp: 10,
    rating: 4.9,
    status: "Active",
    patients: 980,
    email: "sara.t@alert.et",
    phone: "+251 911 02 0302",
    image: avatar2,
  },
  {
    name: "Dr. Philips Girma",
    specialty: "Cardiology",
    dept: "Cardiology",
    exp: 16,
    rating: 4.7,
    status: "In Surgery",
    patients: 860,
    email: "philips.g@alert.et",
    phone: "+251 911 03 0403",
    image: avatar3,
  },
  {
    name: "Dr. Lina Mengistu",
    specialty: "Orthopedics",
    dept: "Orthopedics",
    exp: 12,
    rating: 4.8,
    status: "Active",
    patients: 720,
    email: "lina.m@alert.et",
    phone: "+251 911 04 0504",
    image: avatar4,
  },
  {
    name: "Dr. Tesfaye Hailu",
    specialty: "General Surgery",
    dept: "General Surgery",
    exp: 18,
    rating: 4.9,
    status: "On Leave",
    patients: 1100,
    email: "tesfaye.h@alert.et",
    phone: "+251 911 05 0605",
    image: avatar5,
  },
  {
    name: "Dr. Bethlehem Arega",
    specialty: "Obstetrics",
    dept: "MCH",
    exp: 11,
    rating: 4.8,
    status: "Active",
    patients: 1340,
    email: "beth.a@alert.et",
    phone: "+251 911 06 0706",
    image: avatar6,
  },
  {
    name: "Dr. Daniel Kebede",
    specialty: "Emergency Medicine",
    dept: "Emergency Corridor",
    exp: 9,
    rating: 4.6,
    status: "Active",
    patients: 1560,
    email: "daniel.k@alert.et",
    phone: "+251 911 07 0807",
    image: avatar1,
  },
  {
    name: "Dr. Hanna Seyoum",
    specialty: "Anesthesiology",
    dept: "Surgical Service",
    exp: 13,
    rating: 4.7,
    status: "Active",
    patients: 890,
    email: "hanna.s@alert.et",
    phone: "+251 911 08 0908",
    image: avatar2,
  },
  {
    name: "Dr. Yonas Fikre",
    specialty: "Oncology",
    dept: "Inpatient",
    exp: 15,
    rating: 4.8,
    status: "Active",
    patients: 640,
    email: "yonas.f@alert.et",
    phone: "+251 911 09 1010",
    image: avatar3,
  },
  {
    name: "Dr. Meron Asfaw",
    specialty: "Gynecology",
    dept: "MCH",
    exp: 8,
    rating: 4.7,
    status: "In Surgery",
    patients: 920,
    email: "meron.a@alert.et",
    phone: "+251 911 10 1111",
    image: avatar4,
  },
  {
    name: "Dr. Solomon Bekele",
    specialty: "Neurosurgery",
    dept: "Surgical Service",
    exp: 17,
    rating: 4.9,
    status: "Active",
    patients: 510,
    email: "solomon.b@alert.et",
    phone: "+251 911 11 1212",
    image: avatar5,
  },
  {
    name: "Dr. Tigist Lemma",
    specialty: "Dermatology",
    dept: "OPD",
    exp: 7,
    rating: 4.5,
    status: "Active",
    patients: 780,
    email: "tigist.l@alert.et",
    phone: "+251 911 12 1313",
    image: avatar6,
  },
  {
    name: "Dr. Fitsum Alemayehu",
    specialty: "ENT",
    dept: "OPD",
    exp: 10,
    rating: 4.6,
    status: "On Leave",
    patients: 670,
    email: "fitsum.a@alert.et",
    phone: "+251 911 13 1414",
    image: avatar1,
  },
  {
    name: "Dr. Rahel Tesfaye",
    specialty: "Ophthalmology",
    dept: "OPD",
    exp: 11,
    rating: 4.8,
    status: "Active",
    patients: 740,
    email: "rahel.t@alert.et",
    phone: "+251 911 14 1515",
    image: avatar2,
  },
  {
    name: "Dr. Girma Demissie",
    specialty: "Urology",
    dept: "Surgical Service",
    exp: 14,
    rating: 4.7,
    status: "Active",
    patients: 590,
    email: "girma.d@alert.et",
    phone: "+251 911 15 1616",
    image: avatar3,
  },
  {
    name: "Dr. Abeba Mulugeta",
    specialty: "Nephrology",
    dept: "Internal Medicine",
    exp: 12,
    rating: 4.8,
    status: "Active",
    patients: 620,
    email: "abeba.m@alert.et",
    phone: "+251 911 16 1717",
    image: avatar4,
  },
  {
    name: "Dr. Kassahun Tadesse",
    specialty: "Pulmonology",
    dept: "Internal Medicine",
    exp: 13,
    rating: 4.6,
    status: "In Surgery",
    patients: 540,
    email: "kassahun.t@alert.et",
    phone: "+251 911 17 1818",
    image: avatar5,
  },
  {
    name: "Dr. Worknesh Debele",
    specialty: "Endocrinology",
    dept: "Internal Medicine",
    exp: 9,
    rating: 4.7,
    status: "Active",
    patients: 710,
    email: "worknesh.d@alert.et",
    phone: "+251 911 18 1919",
    image: avatar6,
  },
  {
    name: "Dr. Bereket Alemu",
    specialty: "Radiology",
    dept: "Inpatient",
    exp: 8,
    rating: 4.5,
    status: "Active",
    patients: 830,
    email: "bereket.a@alert.et",
    phone: "+251 911 19 2020",
    image: avatar1,
  },
  {
    name: "Dr. Desta Getachew",
    specialty: "Pathology",
    dept: "Inpatient",
    exp: 15,
    rating: 4.7,
    status: "Active",
    patients: 460,
    email: "desta.g@alert.et",
    phone: "+251 911 20 2121",
    image: avatar2,
  },
  {
    name: "Dr. Fikadu Haile",
    specialty: "Psychiatry",
    dept: "OPD",
    exp: 11,
    rating: 4.8,
    status: "On Leave",
    patients: 520,
    email: "fikadu.h@alert.et",
    phone: "+251 911 21 2222",
    image: avatar3,
  },
  {
    name: "Dr. Genet Mekonnen",
    specialty: "Rheumatology",
    dept: "OPD",
    exp: 10,
    rating: 4.6,
    status: "Active",
    patients: 480,
    email: "genet.m@alert.et",
    phone: "+251 911 22 2323",
    image: avatar4,
  },
  {
    name: "Dr. Hailu Bekele",
    specialty: "Gastroenterology",
    dept: "Internal Medicine",
    exp: 14,
    rating: 4.8,
    status: "Active",
    patients: 690,
    email: "hailu.b@alert.et",
    phone: "+251 911 23 2424",
    image: avatar5,
  },
  {
    name: "Dr. Kidist Tadesse",
    specialty: "Hematology",
    dept: "Inpatient",
    exp: 9,
    rating: 4.7,
    status: "Active",
    patients: 430,
    email: "kidist.t@alert.et",
    phone: "+251 911 24 2525",
    image: avatar6,
  },
  {
    name: "Dr. Mulugeta Seyoum",
    specialty: "Infectious Disease",
    dept: "Emergency Corridor",
    exp: 12,
    rating: 4.6,
    status: "In Surgery",
    patients: 760,
    email: "mulugeta.s@alert.et",
    phone: "+251 911 25 2626",
    image: avatar1,
  },
  {
    name: "Dr. Netsanet Arega",
    specialty: "Physical Medicine",
    dept: "Postoperative Care",
    exp: 8,
    rating: 4.9,
    status: "Active",
    patients: 580,
    email: "netsanet.a@alert.et",
    phone: "+251 911 26 2727",
    image: avatar2,
  },
];

const statusStyles: Record<string, string> = {
  Active: "bg-success/12 text-success",
  "In Surgery": "bg-primary/12 text-primary",
  "On Leave": "bg-warning/15 text-warning",
};

function QmtOfficerPage() {
  return (
    <DashboardShell>
      <main className="flex-1 space-y-4 sm:space-y-5 p-3.5 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">QMT Officer</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              26 Quality Management Team officer profiles across all hospital departments.
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-3.5 sm:size-4 text-primary" />
            Back to Dashboard
          </Link>
        </div>

        <section className="card-soft flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search QMT officers by name or specialty..."
              className="w-full rounded-full bg-muted py-2 pl-9 pr-3 sm:py-2.5 sm:pl-10 sm:pr-4 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            <span>{officers.filter((d) => d.status === "Active").length} active now</span>
          </div>
        </section>

        <section className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {officers.map((officer) => {
            const initials = officer.name
              .split(" ")
              .slice(1)
              .map((n) => n[0])
              .join("")
              .slice(0, 2);

            return (
              <article
                key={officer.email}
                className="card-soft group flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/12 text-lg font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {initials}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[officer.status]}`}
                  >
                    <Clock className="size-3" />
                    {officer.status}
                  </span>
                </div>

                <div className="mt-4 min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {officer.name}
                  </h2>
                  <p className="text-sm text-primary">{officer.specialty}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                    <UserCheck className="size-3" />
                    {officer.dept}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                    <CalendarDays className="size-3" />
                    {officer.exp} yrs
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                    <Star className="size-3 fill-warning text-warning" />
                    {officer.rating}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary" />
                    ALERT Hospital, Addis Ababa
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-3.5 text-primary" />
                    <span className="truncate">{officer.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 text-primary" />
                    {officer.phone}
                  </p>
                </div>

                <div className="mt-auto pt-4">
                  <button className="w-full rounded-xl bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                    View Profile
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </DashboardShell>
  );
}
