package com.courseflow.backend.DegreePrograms;

public enum ClassCategory {

    /*
     * ==========================================
     * SHARED PRIMARY CLASSES
     * ==========================================
     */
    ENGINEERING_BASIC_PROGRAM,      // 24 cr (Shared across engineering)
    MATH_AND_PHYSICAL_SCIENCE,      // 17 cr (Shared)
    GENERAL_EDUCATION,              // 21 cr (Shared)
    OPEN_ELECTIVE,                  // 3 cr (Shared)
    SENIOR_DESIGN,                  // 5 cr (SE 4910/4920 or CPRE 4910/4920)

    /*
     * ==========================================
     * SOFTWARE ENGINEERING (SE) SPECIFIC
     * ==========================================
     */
    SOFTWARE_ENGINEERING_CORE,      // 37 cr
    SOFTWARE_ENGINEERING_ELECTIVE,  // 9 cr
    SUPPLEMENTAL_ELECTIVE,          // 9 cr

    /*
     * ==========================================
     * COMPUTER ENGINEERING (CPRE) SPECIFIC
     * ==========================================
     */
    COMPUTER_ENGINEERING_CORE,      // 40 cr
    CPRE_TECHNICAL_ELECTIVE,        // 14 cr
    TECHNICAL_ELECTIVE,             // 6 cr
    SEMINAR_COOP_INTERNSHIP,        // For 0-credit 'R' classes like CPRE 1660 & 4940

    /*
     * ==========================================
     * AEROSPACE ENGINEERING (AERE) SPECIFIC
     * ==========================================
     */
    AEROSPACE_ENGINEERING_CORE,     // 47 cr
    AERE_OTHER_REMAINING,           // 19 cr (MATE 2730, ME 3450, etc.)
    AERE_TECH_ELECTIVE_A,           // 3 cr
    AERE_TECH_ELECTIVE_B,           // 3 cr
    AERE_TECH_ELECTIVE_C,           // 3 cr

    /*
     * ==========================================
     * MECHANICAL ENGINEERING (ME) SPECIFIC
     * ==========================================
     */
    ME_FOUNDATIONS,                 // 22 cr (Statics, Dynamics, Thermo, EE Circuits)
    MECHANICAL_ENGINEERING_CORE,    // 21 cr (Fluids, Heat Transfer, Machine Design)

    /*
     * ==========================================
     * MATERIALS ENGINEERING (MATE) SPECIFIC
     * ==========================================
     */
    MATERIALS_ENGINEERING_CORE,     // 38 cr
    MATE_CORE_ELECTIVE,             // 12 cr
    MATE_ELECTIVE,                  // 6 cr
    ADVANCED_COMMUNICATION,         // 6 cr (ENGL 2500 + Choice)
    MATE_OTHER_REMAINING,           // 3 cr (STAT 3050)

    /*
     * ==========================================
     * CONSTRUCTION ENGINEERING (CONE) SPECIFIC
     * ==========================================
     */
    CONSTRUCTION_ENGINEERING_CORE,  // 27 cr
    ADDITIONAL_REQUIRED_COURSES,    // 23 cr
    ENGINEERING_TOPICS_ELECTIVE,    // 3 or 6 cr depending on Option

    // The Four Focus Options
    CONE_BUILDING_OPTION,           // 24 cr
    CONE_ELECTRICAL_OPTION,         // 23 cr
    CONE_INFRASTRUCTURE_OPTION,     // 20 cr
    CONE_MECHANICAL_OPTION,         // 23 cr

    /*
     * ==========================================
     * CYBER SECURITY (CYBE) SPECIFIC
     * ==========================================
     */
    // Major Categories
    CYBER_SECURITY_ENGINEERING_CORE, // 41 cr
    CYBER_SECURITY_ELECTIVE,         // 12 cr

    // Minor Categories
    CYBER_SECURITY_MINOR_CORE,       // 12 cr (9 fixed + 3 OS Choice)
    CYBER_SECURITY_MINOR_ELECTIVE,   // 3 cr

    /*
     * ==========================================
     * ENGINEERING SALES MINOR SPECIFIC
     * ==========================================
     */
    ENGR_SALES_MINOR_CORE, // 15 cr total (12 fixed + 3 Econ Choice)

    /*
     * ==========================================
     * BIOMEDICAL ENGINEERING MINOR SPECIFIC
     * ==========================================
     */
    BME_MINOR_CORE,                   // 9 cr (6 fixed + 3 bio choice)
    BME_MINOR_ENGR_INTRO_ELECTIVE,    // 3 cr
    BME_MINOR_ADV_ENGR_ELECTIVE,      // 3 cr
    BME_MINOR_PROFESSIONAL_ELECTIVE,  // 2 cr

    /*
     * ==========================================
     * ENERGY SYSTEMS MINOR SPECIFIC
     * ==========================================
     */
    ENERGY_SYSTEMS_MINOR_CORE,        // 6 cr
    ENERGY_SYSTEMS_MINOR_ELECTIVE,    // 9 cr

    /*
     * ==========================================
     * CYBER-PHYSICAL SYSTEMS MINOR SPECIFIC
     * ==========================================
     */
    CYBER_PHYSICAL_MINOR_CORE,        // 9 cr (ME 2800, AERE 3640, CPRE 2870)
    CYBER_PHYSICAL_MINOR_ELECTIVE,    // 6 cr

    /*
     * ==========================================
     * CHECKBOX CLASSES (Tags)
     * ==========================================
     */
    INTERNATIONAL_PERSPECTIVES,     // 3 cr, count as gen eds
    US_CULTURES_AND_COMMUNITIES,    // 3 cr, count as gen eds
    COMMUNICATION_PROFICIENCY       // 10 cr, count as other classes
}