export const validateMandatoryFields = (data, mandatoryFields) => {
    mandatoryFields.forEach(field => {
        if (!data[field]) {
            throw new Error(`Field ${field} is required`);
        }
    });
    return true;
}
