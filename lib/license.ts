/**
 * License status shown in the reference UI ("License: Active",
 * "350 day(s) remaining. Expires 2027-09-08").
 *
 * The schema has no license table, so the expiry date is a build-time
 * constant; days remaining are computed live so the banner stays truthful.
 */

export const LICENSE_EXPIRES_ON = "2027-09-08";

export interface LicenseInfo {
    active: boolean;
    daysRemaining: number;
    expiresOn: string;
}

export function getLicense(now = new Date()): LicenseInfo {
    const msPerDay = 24 * 60 * 60 * 1000;
    const midnight = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const expires = new Date(`${LICENSE_EXPIRES_ON}T00:00:00`);
    // Whole calendar days between today and the expiry date, so the count is
    // stable all day (350 on 2026-09-23, as in the reference screenshots).
    const daysRemaining = Math.max(0, Math.round((midnight(expires) - midnight(now)) / msPerDay));
    return {
        active: daysRemaining > 0,
        daysRemaining,
        expiresOn: LICENSE_EXPIRES_ON,
    };
}
