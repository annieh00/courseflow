package com.courseflow.backend.DegreePrograms;

public enum RequirementGroup {

    /*
     * ==========================================
     * SHARED GROUPS (SE & CPRE)
     * ==========================================
     */
    // General Education & Basic Program "Choose 1"
    ECON_CHOICE,            // ECON 1010, 1020, 1030X, or IE 3050
    ENGL_UPPER_CHOICE,      // ENGL 3090 or ENGL 3140
    SPEECH_CHOICE,          // SPCM 2120 or COMST 2140
    CHEMISTRY_CHOICE,       // CHEM 1670 or 1770
    GEN_ED_3000_CHOICE,      // for 3000+ gen ed requirements

    /*
     * ==========================================
     * SOFTWARE ENGINEERING (SE) SPECIFIC
     * ==========================================
     */
    // SE Core "Choose 1"
    SE_PROG_TECH_CHOICE,    // COMS 3270 or CPRE 2880
    SE_ARCH_CHOICE,         // COMS 3210 or CPRE 3810
    SE_OS_CHOICE,           // COMS 3520 or CPRE 3080
    SE_DISCRETE_CHOICE,     // COMS 2300 or CPRE 3100

    // Math "Choose 1"
    SE_MATH_ELECTIVE_CHOICE, // MATH 2070, 2650, 3040, 3140, or 3170

    /*
     * ==========================================
     * COMPUTER ENGINEERING (CPRE) SPECIFIC
     * ==========================================
     */
    // CPRE Core and Math are fixed, so no specific choice groups are needed yet

    /*
     * ==========================================
     * AEROSPACE ENGINEERING (AERE) SPECIFIC
     * ==========================================
     */
    // Core Choices
    AERE_PROPULSION_CHOICE, // AERE 4150 or AERE 4330
    AERE_DESIGN_1_CHOICE,   // AERE 4610 or AERE 4600
    AERE_DESIGN_2_CHOICE,   // AERE 4620 or AERE 4700

    // Remaining Course Choices
    AERE_STATICS_CHOICE,    // CE 2740 (or CE 2710 & 2720)

    /*
     * ==========================================
     * MECHANICAL ENGINEERING (ME) SPECIFIC
     * ==========================================
     */
    ME_COMMUNICATION_CHOICE, // SPCM 2120, ENGL 3020, ENGL 3090, or ENGL 3140

    /*
     * ==========================================
     * MATERIALS ENGINEERING (MATE) SPECIFIC
     * ==========================================
     */
    MATE_COMMUNICATION_CHOICE, // ENGL 3140, ENGL 3090, or ENGL 3020

    /*
     * ==========================================
     * CONSTRUCTION ENGINEERING (CONE) SPECIFIC
     * ==========================================
     */
    CONE_STAT_CHOICE,           // STAT 3050 or STAT 3030
    CONE_MATH_CHOICE,           // MATH 2650 or MATH 2070
    LAW_ELECTIVE_CHOICE,        // CONE 3800 or ACCT 2150
    CONE_COMMUNICATION_CHOICE,  // ENGL 3020, ENGL 3090, or ENGL 3140

    /*
     * ==========================================
     * CYBER SECURITY (CYBE) SPECIFIC
     * ==========================================
     */
    CYBE_MINOR_OS_CHOICE,   // CPRE 3080, COMS 2520, or COMS 3520

    /*
     * ==========================================
     * ENGINEERING SALES MINOR SPECIFIC
     * ==========================================
     */
    ENGR_SALES_ECON_CHOICE, // I E 3050 or C E 2060

    /*
     * ==========================================
     * BIOMEDICAL ENGINEERING MINOR SPECIFIC
     * ==========================================
     */
    BME_BIOL_CHOICE, // BIOL 2560 or BIOL 3350

    /*
     * ==========================================
     * MANDATORY / NO CHOICE
     * ==========================================
     */
    // Logic for required but no-choice classes
    NONE                    // For classes that are mandatory and have no alternatives
}