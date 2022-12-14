package com.getup;

import static android.content.Context.ALARM_SERVICE;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Parcel;
import android.os.Parcelable;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Locale;
import java.util.Objects;

public class Alarm implements Parcelable {
    private int id;
    private boolean[] days;
    private int hours;
    private int mins;
    private boolean enabled;
    private Uri sound;
    private PendingIntent[] pendingIntents;

    public Alarm(int id, boolean[] days, int hours, int mins) {
        this.id = id;
        this.days = days;
        this.hours = hours;
        this.mins = mins;
        this.enabled = true;
        this.sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        this.pendingIntents = new PendingIntent[7];

        Log.d(AlarmModule.class.getSimpleName(), toString());
    }

    protected Alarm(Parcel in) {
        id = in.readInt();
        days = in.createBooleanArray();
        hours = in.readInt();
        mins = in.readInt();
        enabled = in.readByte() != 0;
        sound = in.readParcelable(Uri.class.getClassLoader());
        pendingIntents = in.createTypedArray(PendingIntent.CREATOR);
    }

    public static final Creator<Alarm> CREATOR = new Creator<Alarm>() {
        @Override
        public Alarm createFromParcel(Parcel in) {
            return new Alarm(in);
        }

        @Override
        public Alarm[] newArray(int size) {
            return new Alarm[size];
        }
    };

    @RequiresApi(api = Build.VERSION_CODES.M)
    public void registerAlarms(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(ALARM_SERVICE);
        int numDays = 0;
        for (int i = 1; i <= 7; i++) {
            if (days[i-1]) {
                registerAlarm(context, am, i);
                numDays++;
            }
        }
        if (numDays == 0) {
            int day = getImmediateDay();
            registerAlarm(context, am, day);
        }
    }

    private int getImmediateDay() {
        Calendar alarm_date = Calendar.getInstance();
        alarm_date.set(Calendar.HOUR_OF_DAY, hours);
        alarm_date.set(Calendar.MINUTE, mins);
        alarm_date.set(Calendar.SECOND, 0);
        alarm_date.set(Calendar.MILLISECOND, 0);
        Calendar current = Calendar.getInstance();
        current.set(Calendar.SECOND, 0);
        current.set(Calendar.MILLISECOND, 0);
        if (current.after(alarm_date)) {
            alarm_date.add(Calendar.DAY_OF_WEEK, 1);
        }
        return alarm_date.get(Calendar.DAY_OF_WEEK);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void registerAlarm(Context context, AlarmManager am, int day) {
        Intent intent = new Intent(context, AlarmBroadcastReceiver.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        intent.putExtra("alarm", this);

        int code = day * 10000 + hours * 100 + mins;
        Log.d(AlarmModule.class.getSimpleName(), "Request Code: " + code);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, code, intent,
                    PendingIntent.FLAG_IMMUTABLE);
        this.pendingIntents[day-1] = pendingIntent;

        Calendar c = getCalendar(day, hours, mins);
        Log.d(AlarmModule.class.getSimpleName(),
                String.format("registerAlarm(): for Date:%d at %02d:%02d",
                        c.get(Calendar.DAY_OF_MONTH), c.get(Calendar.HOUR_OF_DAY),
                        c.get(Calendar.MINUTE)));

        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pendingIntent);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public void updateAlarms(Context context, int hours, int mins, boolean[] days) {
        cancelAlarms(context);
        this.hours = hours;
        this.mins = mins;
        this.days = days;
        registerAlarms(context);
    }

    public void cancelAlarms(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(ALARM_SERVICE);
        for (int i = 0; i < pendingIntents.length; i++) {
            if (pendingIntents[i] == null) continue;
            am.cancel(pendingIntents[i]);
            pendingIntents[i].cancel();
            pendingIntents[i] = null;
        }
        Log.d(AlarmModule.class.getSimpleName(), String.format("cancelAlarms(): %s", this));
    }

    private Calendar getCalendar(int day, int hours, int mins) {
        Calendar alarm_date = Calendar.getInstance();
        alarm_date.set(Calendar.DAY_OF_WEEK, day);
        alarm_date.set(Calendar.HOUR_OF_DAY, hours);
        alarm_date.set(Calendar.MINUTE, mins);
        alarm_date.set(Calendar.SECOND, 0);
        alarm_date.set(Calendar.MILLISECOND, 0);
        Calendar current = Calendar.getInstance();
        current.set(Calendar.SECOND, 0);
        current.set(Calendar.MILLISECOND, 0);
        if (current.after(alarm_date)) {
            alarm_date.add(Calendar.WEEK_OF_YEAR, 1);
        }
        return alarm_date;
    }

    public int getId() {
        return id;
    }

    public boolean[] getDays() {
        return days;
    }

    public int getHours() {
        return hours;
    }

    public int getMins() {
        return mins;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        // TODO - enable and disbale alarms
        this.enabled = enabled;
    }

    public Uri getSound() {
        return sound;
    }

    public void setSound(Uri sound) {
        // TODO - change notification sound
        this.sound = sound;
    }

    @NonNull
    @Override
    public String toString() {
        return "Alarm{" +
                "id=" + id +
                ", time=" + String.format(Locale.ENGLISH, "%02d:%02d", hours, mins) +
                ", days=" + Arrays.toString(days) +
                ", enabled=" + enabled +
                ", sound=" + sound +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Alarm alarm = (Alarm) o;
        return hours == alarm.hours && mins == alarm.mins && enabled == alarm.enabled &&
                id == alarm.id && Arrays.equals(days, alarm.days) &&
                Objects.equals(sound, alarm.sound) &&
                Arrays.equals(pendingIntents, alarm.pendingIntents);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(id, hours, mins, enabled);
        result = 31 * result + Arrays.hashCode(days);
        return result;
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(id);
        dest.writeBooleanArray(days);
        dest.writeInt(hours);
        dest.writeInt(mins);
        dest.writeBoolean(enabled);
        dest.writeParcelable(sound, 0);
        dest.writeTypedArray(pendingIntents, 0);
    }
}
