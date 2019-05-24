package utils;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by kennych on 1/7/16.
 */
public class ComUtilsEx {
    //utils to check properties exist...
    public static Boolean objectHasProperty(Object obj, String propertyName){
        List<Field> properties = getAllFields(obj);
        for(Field field : properties){
            if(field.getName().equalsIgnoreCase(propertyName)){
                return true;
            }
        }
        return false;
    }

    private static List<Field> getAllFields(Object obj){
        List<Field> fields = new ArrayList<Field>();
        getAllFieldsRecursive(fields, obj.getClass());
        return fields;
    }

    private static List<Field> getAllFieldsRecursive(List<Field> fields, Class<?> type) {
        for (Field field: type.getDeclaredFields()) {
            fields.add(field);
        }

        if (type.getSuperclass() != null) {
            fields = getAllFieldsRecursive(fields, type.getSuperclass());
        }

        return fields;
    }


}
