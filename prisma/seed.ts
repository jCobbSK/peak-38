import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/peak38",
});
const prisma = new PrismaClient({ adapter });

const configData = {
  meta: {
    version: 1,
    created_at: "2026-05-25",
    start_date: "2026-05-25",
    end_date: "2028-08-02",
    user: "Jakub",
    birthdate_target: "2028-08-02"
  },
  pillars: {
    physical: {
      strength: {
        lifts: [
          {
            key: "deadlift_conventional",
            label: "Deadlift (conventional)",
            unit: "kg",
            baseline: 140,
            checkpoints: {
              cp_00: { target: 140, note: "baseline test" },
              cp_01: null,
              cp_02: null,
              cp_03: { target: 160 },
              cp_04: { target: 168 },
              cp_05: { target: 175 },
              cp_06: { target: 182 },
              cp_07: { target: 192 },
              cp_08: { target: 198 },
              cp_09: null,
              cp_10: { target: 200 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 200, note: "final benchmark" }
            }
          },
          {
            key: "trap_bar_deadlift",
            label: "Trap Bar Deadlift",
            unit: "kg",
            baseline: null,
            checkpoints: {
              cp_00: null,
              cp_01: null,
              cp_02: null,
              cp_03: { target: 170 },
              cp_04: { target: 180 },
              cp_05: { target: 190 },
              cp_06: { target: 200 },
              cp_07: { target: 210 },
              cp_08: null,
              cp_09: null,
              cp_10: { target: 215 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 215 }
            }
          },
          {
            key: "bench_press",
            label: "Bench Press",
            unit: "kg",
            baseline: 115,
            checkpoints: {
              cp_00: { target: 115, note: "baseline test" },
              cp_01: null,
              cp_02: null,
              cp_03: { target: 118 },
              cp_04: { target: 120 },
              cp_05: { target: 123 },
              cp_06: { target: 125 },
              cp_07: { target: 130 },
              cp_08: null,
              cp_09: null,
              cp_10: { target: 130 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 130, note: "maintain" }
            }
          },
          {
            key: "overhead_press",
            label: "Overhead Press",
            unit: "kg",
            baseline: 65,
            checkpoints: {
              cp_00: { target: 65, note: "baseline" },
              cp_01: null,
              cp_02: null,
              cp_03: { target: 70 },
              cp_04: { target: 73 },
              cp_05: { target: 75 },
              cp_06: { target: 78 },
              cp_07: { target: 80 },
              cp_08: null,
              cp_09: null,
              cp_10: { target: 80 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 80, note: "maintain" }
            }
          },
          {
            key: "weighted_pullup",
            label: "Weighted Pull-up",
            unit: "kg_added",
            baseline: null,
            checkpoints: {
              cp_00: null,
              cp_01: null,
              cp_02: null,
              cp_03: { target: 10 },
              cp_04: { target: 15 },
              cp_05: { target: 18 },
              cp_06: { target: 20 },
              cp_07: { target: 25 },
              cp_08: null,
              cp_09: null,
              cp_10: { target: 25 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 25, note: "maintain" }
            }
          },
          {
            key: "barbell_curl",
            label: "Barbell Curl",
            unit: "kg",
            baseline: null,
            checkpoints: {
              cp_00: null,
              cp_01: null,
              cp_02: null,
              cp_03: { target: 40 },
              cp_04: { target: 43 },
              cp_05: { target: 45 },
              cp_06: { target: 48 },
              cp_07: { target: 50 },
              cp_08: null,
              cp_09: null,
              cp_10: { target: 50 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 50, note: "maintain" }
            }
          },
          {
            key: "weighted_dip",
            label: "Weighted Dip",
            unit: "kg_added",
            baseline: null,
            checkpoints: {
              cp_00: null,
              cp_01: null,
              cp_02: null,
              cp_03: { target: 15 },
              cp_04: { target: 20 },
              cp_05: { target: 25 },
              cp_06: { target: 30 },
              cp_07: { target: 35 },
              cp_08: null,
              cp_09: null,
              cp_10: { target: 35 },
              cp_11: null,
              cp_12: null,
              ironman: { target: 35, note: "maintain" }
            }
          }
        ]
      },
      bodyweight: {
        unit: "kg",
        baseline: 95,
        target_final: 82,
        checkpoints: {
          cp_00: { target: 95 },
          cp_01: { target: 93 },
          cp_02: { target: 90 },
          cp_03: { target: 88 },
          cp_04: { target: 86 },
          cp_05: { target: 84 },
          cp_06: { target: 83 },
          cp_07: { target: 82 },
          cp_08: { target: 81 },
          cp_09: { target: 81 },
          cp_10: { target: 81 },
          cp_11: { target: 80 },
          cp_12: { target: 80 },
          ironman: { target: 81 }
        }
      },
      endurance: {
        races: [
          {
            key: "race_01_night_run_10k",
            label: "Telekom Night Run Bratislava",
            type: "registered_race",
            distance_km: 10,
            date: "2026-09-05",
            checkpoint_id: "cp_02",
            target_seconds: 3420,
            target_display: "sub 57:00",
            location: "Bratislava, SK"
          },
          {
            key: "race_02_prague_half",
            label: "Generali Prague Half Marathon",
            type: "registered_race",
            distance_km: 21.1,
            date: "2027-04-03",
            checkpoint_id: "cp_05",
            target_seconds: 8100,
            target_display: "sub 2:15:00",
            location: "Prague, CZ"
          },
          {
            key: "race_03_kosice_half",
            label: "Košice Peace Marathon — Half",
            type: "registered_race",
            distance_km: 21.1,
            date: "2027-10-01",
            checkpoint_id: "cp_08",
            target_seconds: 7500,
            target_display: "sub 2:05:00",
            location: "Košice, SK"
          },
          {
            key: "race_04_prague_marathon",
            label: "Prague Marathon",
            type: "registered_race",
            distance_km: 42.2,
            date: "2028-05-01",
            checkpoint_id: "cp_11",
            target_seconds: 17100,
            target_display: "sub 4:45:00",
            location: "Prague, CZ"
          }
        ],
        self_organized: [
          {
            key: "solo_run_5k_jul26",
            label: "5K Time Trial",
            type: "self_organized",
            distance_km: 5,
            checkpoint_id: "cp_01",
            target_display: "first benchmark"
          },
          {
            key: "solo_bike_50k",
            label: "50km Solo Ride",
            type: "self_organized",
            distance_km: 50,
            checkpoint_id: "cp_03",
            target_display: "just finish"
          },
          {
            key: "solo_swim_1km",
            label: "1km Pool Time Trial",
            type: "self_organized",
            distance_km: 1,
            checkpoint_id: "cp_03",
            target_seconds: 1680,
            target_display: "sub 28:00"
          },
          {
            key: "solo_swim_15km",
            label: "1.5km Pool Time Trial",
            type: "self_organized",
            distance_km: 1.5,
            checkpoint_id: "cp_04",
            target_display: "step up"
          },
          {
            key: "solo_run_5k_may27",
            label: "5K Fast Time Trial",
            type: "self_organized",
            distance_km: 5,
            checkpoint_id: "cp_06",
            target_display: "raw speed check"
          },
          {
            key: "solo_swim_2km_jun27",
            label: "2km Pool Time Trial",
            type: "self_organized",
            distance_km: 2,
            checkpoint_id: "cp_06",
            target_seconds: 3120,
            target_display: "sub 52:00"
          },
          {
            key: "solo_bike_75k",
            label: "75km Solo Ride",
            type: "self_organized",
            distance_km: 75,
            checkpoint_id: "cp_05",
            target_display: "step up from 50km"
          },
          {
            key: "solo_run_10k_jul27",
            label: "10K Time Trial",
            type: "self_organized",
            distance_km: 10,
            checkpoint_id: "cp_07",
            target_seconds: 3000,
            target_display: "sub 50:00"
          },
          {
            key: "solo_bike_100k",
            label: "100km Solo Ride",
            type: "self_organized",
            distance_km: 100,
            checkpoint_id: "cp_08",
            target_seconds: 14400,
            target_display: "sub 4:00:00"
          },
          {
            key: "solo_bike_60k_pace",
            label: "60km Ironman-Pace Ride",
            type: "self_organized",
            distance_km: 60,
            checkpoint_id: "cp_09",
            target_display: "pacing practice"
          },
          {
            key: "solo_swim_3km",
            label: "3km Pool Time Trial",
            type: "self_organized",
            distance_km: 3,
            checkpoint_id: "cp_10",
            target_seconds: 4800,
            target_display: "sub 80:00"
          },
          {
            key: "solo_run_10k_jan28",
            label: "10K Fitness Check",
            type: "self_organized",
            distance_km: 10,
            checkpoint_id: "cp_10",
            target_display: "compare to all previous"
          },
          {
            key: "solo_bike_150k",
            label: "150km Solo Ride",
            type: "self_organized",
            distance_km: 150,
            checkpoint_id: "cp_12",
            target_display: "final long ride"
          },
          {
            key: "solo_swim_2km_may28",
            label: "2km Easy Swim",
            type: "self_organized",
            distance_km: 2,
            checkpoint_id: "cp_12",
            target_display: "confidence check"
          },
          {
            key: "solo_run_10k_may28",
            label: "Easy 10K",
            type: "self_organized",
            distance_km: 10,
            checkpoint_id: "cp_12",
            target_display: "legs feel good check"
          },
          {
            key: "ironman_swim",
            label: "Ironman Swim — 3.8km Pool (152 × 25m)",
            type: "ironman_leg",
            distance_km: 3.8,
            checkpoint_id: "ironman"
          },
          {
            key: "ironman_bike",
            label: "Ironman Bike — 180km",
            type: "ironman_leg",
            distance_km: 180,
            checkpoint_id: "ironman"
          },
          {
            key: "ironman_run",
            label: "Ironman Run — 42.2km",
            type: "ironman_leg",
            distance_km: 42.2,
            checkpoint_id: "ironman"
          }
        ]
      },
      mobility: {
        tests: [
          {
            key: "deep_squat_hold",
            label: "Deep Squat Hold (flat-footed)",
            unit: "seconds",
            checkpoints: {
              cp_01: { target: 10, note: "baseline measure" },
              cp_02: { target: 20 },
              cp_03: { target: 30 },
              cp_04: { target: 38 },
              cp_05: { target: 45 },
              cp_06: { target: 50 },
              cp_07: { target: 55 },
              cp_08: { target: 58 },
              ironman: { target: 60 }
            }
          },
          {
            key: "thomas_test",
            label: "Thomas Test (hip flexor)",
            unit: "text",
            scale: ["severe restriction", "noticeable restriction", "moderate", "near full", "full flat"],
            checkpoints: {
              cp_01: { target: "noticeable restriction gone" },
              cp_04: { target: "moderate" },
              cp_06: { target: "near full" },
              ironman: { target: "full flat" }
            }
          },
          {
            key: "sit_and_reach",
            label: "Sit & Reach",
            unit: "cm_past_toes",
            note: "negative = short of toes, positive = past toes",
            checkpoints: {
              cp_01: { target: -5, note: "baseline" },
              cp_03: { target: 0 },
              cp_05: { target: 2 },
              cp_07: { target: 4 },
              ironman: { target: 5 }
            }
          },
          {
            key: "thoracic_rotation",
            label: "Seated Thoracic Rotation",
            unit: "degrees_each_side",
            checkpoints: {
              cp_03: { target: 30, note: "baseline" },
              cp_05: { target: 35 },
              cp_07: { target: 40 },
              cp_09: { target: 43 },
              ironman: { target: 45 }
            }
          },
          {
            key: "overhead_dowel_squat",
            label: "Overhead Dowel Squat Hold",
            unit: "seconds_clean",
            checkpoints: {
              cp_03: { target: 5, note: "passable form" },
              cp_06: { target: 15, note: "clean form" },
              cp_09: { target: 20 },
              cp_11: { target: 25 },
              ironman: { target: 30 }
            }
          }
        ]
      }
    },
    mind: {
      products: [
        {
          key: "product_life_experience_app",
          label: "Life Experience Todo & Rating App",
          phase: 1,
          target_checkpoint: "cp_02",
          goal: "Ship v1 — publicly available",
          milestones: [
            { checkpoint_id: "cp_01", label: "In progress, first UX decisions made" },
            { checkpoint_id: "cp_02", label: "v1 shipped and publicly available" }
          ]
        },
        {
          key: "product_rpg_dev_learning",
          label: "RPG Dev Learning Tool (SW/System Design Interview Prep)",
          phase: 2,
          target_checkpoint: "cp_07",
          goal: "In active personal use — driving toward better contract",
          milestones: [
            { checkpoint_id: "cp_04", label: "UI/UX course started" },
            { checkpoint_id: "cp_05", label: "In active personal use" },
            { checkpoint_id: "cp_06", label: "Better contract actively pursued" },
            { checkpoint_id: "cp_07", label: "Better contract or role landed" },
            { checkpoint_id: "cp_08", label: "Tool mature enough to share if desired" }
          ]
        },
        {
          key: "product_scifi_story",
          label: "Interactive Sci-Fi Storytelling Game",
          phase: 3,
          target_checkpoint: "ironman",
          goal: "First chapter publicly playable",
          milestones: [
            { checkpoint_id: "cp_10", label: "Design and story started" },
            { checkpoint_id: "cp_11", label: "First chapter playable" },
            { checkpoint_id: "ironman", label: "Publicly live" }
          ]
        }
      ],
      skills: [
        {
          key: "skill_uiux",
          label: "UI/UX Design",
          goal: "Complete one structured course + apply design process to own products",
          target_checkpoint: "cp_06"
        },
        {
          key: "skill_system_design",
          label: "System Design",
          goal: "Senior-level fluency — architect and articulate any product confidently",
          target_checkpoint: "cp_07"
        },
        {
          key: "skill_cooking",
          label: "Cooking",
          goal: "Confidently cook varied dishes for family/guests without stress",
          target_checkpoint: "ironman"
        }
      ],
      reading: {
        nonfiction: {
          target_total: 26,
          target_per_month: 1,
          note: "User has own reading list. Log title + one paragraph insight per book.",
          suggested_titles: [
            "The Mom Test",
            "Shape Up",
            "Zero to One",
            "Designing Data-Intensive Applications",
            "A Philosophy of Software Design",
            "Thinking Fast and Slow",
            "Why We Sleep",
            "The Obstacle Is The Way",
            "Sapiens",
            "The Gene",
            "Antifragile"
          ]
        },
        fiction: {
          target_total: 26,
          target_per_month: 1,
          note: "User has own reading list. Continue existing habit.",
          suggested_titles: [
            "Project Hail Mary",
            "Blindsight",
            "A Fire Upon the Deep",
            "Exhalation",
            "The Three-Body Problem",
            "Hyperion",
            "Flowers for Algernon"
          ]
        }
      },
      career: {
        key: "career_better_contract",
        label: "Land significantly better-paying contract or role",
        target_checkpoint: "cp_07",
        target_date: "2027-07-31"
      },
      alias_writing: {
        key: "alias_posts",
        label: "Alias Writing (pseudonymous blog/Medium)",
        target_total: 26,
        target_per_month: 1,
        note: "Technical, training, or any topic. Logged with post URL."
      }
    },
    personal: {
      painting: {
        key: "abstract_painting",
        label: "Abstract Painting",
        target_total: 26,
        target_per_month: 1,
        note: "One finished piece per month. Optional photo proof."
      },
      hiking: {
        key: "solo_hike",
        label: "Solo Hike (no headphones)",
        target_total: 13,
        frequency: "every_2_months",
        note: "Alone, no headphones. Progress trail difficulty as ankle strengthens.",
        checkpoints: {
          cp_01: { target: 1 },
          cp_02: { target: 1 },
          cp_03: { target: 1 },
          cp_04: { target: 1 },
          cp_05: { target: 1 },
          cp_06: { target: 1 },
          cp_07: { target: 1 },
          cp_08: { target: 1 },
          cp_09: { target: 1 },
          cp_10: { target: 1 },
          cp_11: { target: 1 },
          cp_12: { target: 1 },
          ironman: { target: 1 }
        }
      },
      dates: {
        key: "weekly_date",
        label: "Weekly Date — New Place with Wife",
        target_total: 104,
        frequency: "weekly",
        note: "New restaurant, bar, neighbourhood, or experience each time. Keep a visited log."
      },
      journaling: {
        key: "daily_journaling",
        label: "Daily Structured Journaling",
        frequency: "daily",
        prompts: [
          "What did I do today?",
          "What did I think / learn?",
          "What do I want tomorrow to look like?"
        ],
        note: "10 minutes. Tracked as habit streak."
      }
    },
    recovery: {
      sleep: {
        key: "sleep_target",
        label: "Sleep",
        goal: "Consistent 7.5h minimum, asleep by 10:30pm",
        target_checkpoint: "cp_03"
      },
      work_boundary: {
        key: "work_boundary",
        label: "Work Boundary",
        goal: "6pm default stop, 4 out of 5 days. Late days by necessity only.",
        target_checkpoint: "cp_02"
      },
      transition_ritual: {
        key: "transition_ritual",
        label: "Work-to-Evening Transition Ritual",
        goal: "Easy 20-30 min run or walk after work. Daily.",
        note: "Tracked as habit streak."
      },
      solitude: {
        key: "solitude_budget",
        label: "Solitude Budget",
        goal: "Minimum 3 hours of genuine solitude per week, scheduled.",
        note: "Evening walk, solo coffee, anything alone and guilt-free."
      },
      self_check: {
        key: "weekly_self_check",
        label: "Weekly Self-Check (Sunday)",
        dimensions: ["energy", "sleep_quality", "relationship_quality", "work_satisfaction"],
        scale: "1-10",
        note: "2 minutes. Logged in self_checks table. Shown as trend chart."
      },
      social_physical: {
        key: "social_physical",
        label: "Social-Physical Activity with Friend",
        frequency: "monthly",
        target_total: 26,
        note: "Any physical activity with at least one friend. Running, cycling, gym."
      }
    }
  },
  checkpoints: [
    {
      id: "cp_00",
      label: "Checkpoint 0 — Baseline Day",
      date: "2026-05-25",
      type: "baseline",
      description: "Document starting point. No performance tests — injury assessment only.",
      focus: ["bodyweight", "mobility_baseline", "injury_status", "photos"]
    },
    {
      id: "cp_01",
      label: "Checkpoint 1 — First Signs of Life",
      date: "2026-07-15",
      type: "progress",
      description: "First working sets logged. Easy run benchmark. Elbow status check.",
      focus: ["strength_working_sets", "run_5k", "mobility_basic", "bodyweight"]
    },
    {
      id: "cp_02",
      label: "Checkpoint 2 — First Race",
      date: "2026-09-05",
      type: "race",
      race_key: "race_01_night_run_10k",
      description: "Telekom Night Run 10K Bratislava. First registered race.",
      focus: ["race_01_night_run_10k", "strength_working_sets", "swim_1km", "mobility", "bodyweight"]
    },
    {
      id: "cp_03",
      label: "Checkpoint 3 — Phase 1 Close",
      date: "2026-11-30",
      type: "1rm_test",
      description: "Full 1RM test. First 50km bike. 6 books read.",
      focus: ["strength_1rm_all", "bike_50k", "swim_1km", "mobility_full", "books_6", "bodyweight"]
    },
    {
      id: "cp_04",
      label: "Checkpoint 4 — New Year Reset",
      date: "2027-01-31",
      type: "progress",
      description: "Phase 2 begins. Swim 1.5km. Thomas test added.",
      focus: ["strength_working_sets", "swim_1_5km", "mobility_full_thomas", "bodyweight", "uiux_course_status"]
    },
    {
      id: "cp_05",
      label: "Checkpoint 5 — Spring Race",
      date: "2027-04-03",
      type: "race",
      race_key: "race_02_prague_half",
      description: "Generali Prague Half Marathon. Target sub 2:15.",
      focus: ["race_02_prague_half", "bike_75k", "strength_working_sets", "mobility", "bodyweight", "rpg_tool_status"]
    },
    {
      id: "cp_06",
      label: "Checkpoint 6 — One Year Anniversary",
      date: "2027-05-31",
      type: "1rm_test",
      description: "Full 1RM test. One year of work. Compare everything to baseline.",
      focus: ["strength_1rm_all", "swim_2km", "bike_75k", "mobility_full", "books_12", "bodyweight", "career_status"]
    },
    {
      id: "cp_07",
      label: "Checkpoint 7 — Strength Peak Attempt",
      date: "2027-07-31",
      type: "1rm_test",
      description: "Primary strength peak. PRs attempted. Ironman volume takes over after this.",
      focus: ["strength_1rm_all", "run_10k", "mobility_full", "bodyweight", "career_milestone"]
    },
    {
      id: "cp_08",
      label: "Checkpoint 8 — Autumn Race",
      date: "2027-10-01",
      type: "race",
      race_key: "race_03_kosice_half",
      description: "Košice Peace Half Marathon. Target sub 2:05. 100km bike following weekend.",
      focus: ["race_03_kosice_half", "bike_100k", "strength_working_sets", "mobility", "bodyweight"]
    },
    {
      id: "cp_09",
      label: "Checkpoint 9 — Ironman Swim Build",
      date: "2027-11-30",
      type: "progress",
      description: "3km pool time trial. Ironman swim confidence. Maintenance strength confirmed.",
      focus: ["swim_3km", "bike_60k_pace", "strength_working_sets", "mobility_full", "bodyweight", "books_18"]
    },
    {
      id: "cp_10",
      label: "Checkpoint 10 — Last Strength Test",
      date: "2028-01-31",
      type: "1rm_test",
      description: "Final full 1RM test. After this, strength is maintenance only.",
      focus: ["strength_1rm_all", "run_10k", "mobility_full", "bodyweight", "scifi_story_status"]
    },
    {
      id: "cp_11",
      label: "Checkpoint 11 — Spring Marathon",
      date: "2028-04-01",
      type: "race",
      race_key: "race_04_prague_marathon",
      description: "Prague Marathon. Last major race before Ironman.",
      focus: ["race_04_prague_marathon", "strength_working_sets", "mobility", "bodyweight", "books_22"]
    },
    {
      id: "cp_12",
      label: "Checkpoint 12 — Dress Rehearsal",
      date: "2028-05-31",
      type: "progress",
      description: "150km solo ride. Taper begins after this.",
      focus: ["bike_150k", "swim_2km_easy", "run_10k_easy", "strength_light", "mobility_full"]
    },
    {
      id: "ironman",
      label: "🎂 IRONMAN DAY — 38th Birthday",
      date: "2028-08-02",
      type: "ironman",
      description: "Self-organized full Ironman. 3.8km pool swim + 180km bike + 42.2km run.",
      focus: ["ironman_swim", "ironman_bike", "ironman_run", "strength_final_benchmark", "mobility_final", "books_26", "all_products"]
    }
  ]
};

async function main() {
  const existing = await prisma.config.findFirst({ where: { isActive: true } });

  if (existing) {
    console.log("Config already exists, skipping seed.");
    return;
  }

  await prisma.config.create({
    data: { version: 1, data: configData, isActive: true }
  });

  console.log("Seeded config successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
