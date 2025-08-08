import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

export interface PatientData {
  name: string;
  age: number;
  gender: string;
  [key: string]: any; // Additional fields can be added as needed
}

export interface Patient {
  patient_data: PatientData;
  embedded_patient_data: number[];
  medical_summary_history: string;
  embedded_summary_history: number[];
}

export interface Appointment {
  patient_id: string;
  appointment_type: string;
  priority_score: number;
  date: string; // ISO string format e.g. '2025-07-30T14:30:00Z'
  duration: number; // Duration in minutes
  appointment_details: string;
  appointment_details_embedded: number[];
}

export async function insertPatient(patient: Patient) {
  try {
    const { data, error } = await supabase
      .from("Patient Information")
      .insert([patient])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert patient: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error inserting patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function insertAppointment(appointment: Appointment) {
  try {
    const { data, error } = await supabase
      .from("Appointments")
      .insert([appointment])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert appointment: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error inserting appointment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function insertMultipleAppointments(appointments: Appointment[]) {
  try {
    const { data, error } = await supabase
      .from("Appointments")
      .insert(appointments)
      .select();

    if (error) {
      throw new Error(`Failed to insert appointments: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error inserting appointments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function insertMultiplePatients(patients: Patient[]) {
  try {
    const { data, error } = await supabase
      .from("Patient Information")
      .insert(patients)
      .select();

    if (error) {
      throw new Error(`Failed to insert patients: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error inserting patients:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deletePatient(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("Patient Information")
      .delete()
      .eq("id", patientId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete patient: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteAppointment(appointmentId: string) {
  try {
    const { data, error } = await supabase
      .from("Appointments")
      .delete()
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteMultiplePatients(patientIds: string[]) {
  try {
    const { data, error } = await supabase
      .from("Patient Information")
      .delete()
      .in("id", patientIds)
      .select();

    if (error) {
      throw new Error(`Failed to delete patients: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting patients:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteMultipleAppointments(appointmentIds: string[]) {
  try {
    const { data, error } = await supabase
      .from("Appointments")
      .delete()
      .in("id", appointmentIds)
      .select();

    if (error) {
      throw new Error(`Failed to delete appointments: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting appointments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deletePatientsByCondition(condition: object) {
  try {
    const { data, error } = await supabase
      .from("Patient Information")
      .delete()
      .match(condition)
      .select();

    if (error) {
      throw new Error(
        `Failed to delete patients by condition: ${error.message}`
      );
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting patients by condition:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteAppointmentsByCondition(condition: object) {
  try {
    const { data, error } = await supabase
      .from("Appointments")
      .delete()
      .match(condition)
      .select();

    if (error) {
      throw new Error(
        `Failed to delete appointments by condition: ${error.message}`
      );
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error deleting appointments by condition:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
