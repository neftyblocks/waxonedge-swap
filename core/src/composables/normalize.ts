import { computed, Ref, toRef } from "vue";

export const normalizedBoolean = (value: Ref<any>): Ref<boolean> => {
    const valueRef = toRef(value);
    return computed(() => {
        if (typeof valueRef.value === "string")
            return valueRef.value === "true" ? true : valueRef.value === "" ? true : false;

        return valueRef.value;
    });
};

export const normalizedObject = <T>(value: Ref<T | string | undefined>): Ref<T | undefined> => {
    const valueRef = toRef(value);
    return computed(() => {
        if (!valueRef.value) return undefined;
        if (typeof valueRef.value === "string") return JSON.parse(valueRef.value);
        return valueRef.value as T;
    });
};
