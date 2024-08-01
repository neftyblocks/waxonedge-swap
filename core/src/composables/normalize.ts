import { computed, Ref, toRef, unref } from "vue";

export const normalizedBoolean = (value: Ref<any>): Ref<boolean> => {
    const unrefValue = unref(value);
    return computed(() => {
        if (typeof unrefValue === "string") return unrefValue === "true" ? true : unrefValue === "" ? true : false;

        return unrefValue;
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
