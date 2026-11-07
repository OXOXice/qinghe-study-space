import { z } from 'zod';
const text = z.string().trim().max(300);
const id = z.string().min(1).max(100);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, '请输入有效日期');
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const courseSchema = z.object({id, name:text.min(1),room:text.min(1),teacher:text, day:z.number().int().min(1).max(7),start:clock,end:clock,firstWeek:z.number().int().min(1).max(52),lastWeek:z.number().int().min(1).max(52),weeks:z.enum(['all','odd','even'])}).refine(c=>c.end>c.start && c.lastWeek>=c.firstWeek,'结束时间或周次不能早于开始');
export const placeSchema = z.object({id,name:text.min(1),category:z.enum(['学习','餐饮','生活','运动','医疗']),location:text.min(1),hours:text.min(1),walk:z.number().int().min(0).max(180),note:text,x:z.number().min(0).max(100),y:z.number().min(0).max(100)});
export const eventSchema = z.object({id,name:text.min(1),date,time:clock,location:text.min(1),people:text,note:text,done:z.boolean()});
export const gradeSchema = z.object({id,name:text.min(1),credit:z.number().positive().max(30),score:z.number().min(0).max(100),semester:text.min(1)});
export const parcelSchema = z.object({id,name:text.min(1),station:text.min(1),code:text.min(1),deadline:date,done:z.boolean()});
export const ruleSchema = z.array(z.object({min:z.number().min(0).max(100),point:z.number().min(0).max(5)})).min(2).max(30).refine(rows=>rows.at(-1)?.min===0&&rows.every((r,i)=>i===0 || r.min<rows[i-1].min),'分数下限需递减且最后一项为 0');
export const stateSchema = z.object({schemaVersion:z.literal(1),settings:z.object({termStart:date,termWeeks:z.number().int().min(1).max(52),ruleName:text.min(1),rules:ruleSchema}),courses:z.array(courseSchema).max(300),places:z.array(placeSchema).max(100),events:z.array(eventSchema).max(500),grades:z.array(gradeSchema).max(300),parcels:z.array(parcelSchema).max(300)});
export type State=z.infer<typeof stateSchema>;
export type Course=z.infer<typeof courseSchema>;
export type Collection='courses'|'places'|'events'|'grades'|'parcels';
export const defaultRules=[{min:90,point:4},{min:85,point:3.7},{min:80,point:3.3},{min:75,point:3},{min:70,point:2.7},{min:65,point:2},{min:60,point:1},{min:0,point:0}];
export function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function academicWeek(termStart:string, day:string){return Math.floor((Date.parse(day+'T00:00:00Z')-Date.parse(termStart+'T00:00:00Z'))/604800000)+1;}
export function coursesOn(state:State,day:string){const d=new Date(day+'T12:00:00'),weekday=d.getDay()||7,w=academicWeek(state.settings.termStart,day);if(w<1||w>state.settings.termWeeks)return [];return state.courses.filter(c=>c.day===weekday&&w>=c.firstWeek&&w<=c.lastWeek&&(c.weeks==='all'||(c.weeks==='odd'?w%2===1:w%2===0))).sort((a,b)=>a.start.localeCompare(b.start));}
export function courseStatus(c:Course,now:Date,day:string){const start=new Date(`${day}T${c.start}:00`),end=new Date(`${day}T${c.end}:00`),minutes=(+start-+now)/60000;return +now>=+end?'已结束':+now>=+start?'进行中':minutes<=15&&minutes>=0?'即将开始':'待上课';}
export function calculateGrades(rows:State['grades'],rules:State['settings']['rules']){const credits=rows.reduce((s,g)=>s+g.credit,0);return {credits,average:credits?rows.reduce((s,g)=>s+g.credit*g.score,0)/credits:null,gpa:credits?rows.reduce((s,g)=>s+g.credit*(rules.find(r=>g.score>=r.min)?.point??0),0)/credits:null};}
export function blankState():State{return {schemaVersion:1,settings:{termStart:'2026-09-07',termWeeks:20,ruleName:'演示用百分制 4.0 规则',rules:defaultRules},courses:[],places:[],events:[],grades:[],parcels:[]};}
export function demoState(now=new Date()):State{
 const s=blankState(),today=dateKey(now),tom=new Date(now);tom.setDate(tom.getDate()+1);const tomorrow=dateKey(tom);
 const mon=new Date(now);mon.setDate(mon.getDate()-((mon.getDay()||7)-1)-8*7);s.settings.termStart=dateKey(mon);
 s.courses=[{id:'demo-course-1',name:'高等数学 A',room:'教学楼 A · 302',teacher:'陈老师',day:now.getDay()||7,start:'08:00',end:'09:35',firstWeek:1,lastWeek:18,weeks:'all'}, {id:'demo-course-2',name:'大学英语',room:'文科楼 · 201',teacher:'李老师',day:now.getDay()||7,start:'10:10',end:'11:45',firstWeek:1,lastWeek:18,weeks:'all'},{id:'demo-course-3',name:'Python 程序设计',room:'实验楼 · 406',teacher:'张老师',day:now.getDay()||7,start:'14:00',end:'15:35',firstWeek:1,lastWeek:18,weeks:'odd'},{id:'demo-course-4',name:'大学体育',room:'东区运动场',teacher:'王老师',day:(now.getDay()||7)%7+1,start:'16:00',end:'17:30',firstWeek:1,lastWeek:18,weeks:'all'}];
 s.places=[{id:'demo-place-1',name:'知行图书馆',category:'学习',location:'校园中轴 · 明理湖东侧',hours:'08:00–22:00',walk:8,note:'示例地点；出发点为示例宿舍，开放时间请以学校公告为准。',x:64,y:34},{id:'demo-place-2',name:'第一食堂',category:'餐饮',location:'生活区 · 一号宿舍南侧',hours:'06:30–21:00',walk:3,note:'示例地点；二楼设有自选餐区。',x:27,y:67},{id:'demo-place-3',name:'校园快递站',category:'生活',location:'西门服务中心',hours:'09:00–20:00',walk:5,note:'示例地点；取件前记得准备取件码。',x:13,y:36},{id:'demo-place-4',name:'东区运动场',category:'运动',location:'东校区 · 体育馆旁',hours:'06:00–22:00',walk:12,note:'示例地点；请遵守场馆开放安排。',x:85,y:66},{id:'demo-place-5',name:'教学楼 A',category:'学习',location:'北区教学组团',hours:'07:00–22:00',walk:10,note:'示例地点；楼层及教室以实际课表为准。',x:39,y:20},{id:'demo-place-6',name:'校医院',category:'医疗',location:'南门内侧',hours:'08:00–17:00',walk:9,note:'示例地点；实际门诊时间请向学校核实。',x:57,y:81}];
 s.events=[{id:'demo-event-1',name:'摄影社 · 秋日校园采风',date:today,time:'18:30',location:'图书馆门口',people:'摄影社新成员',note:'带上手机，记录校园的秋天。模拟社团活动。',done:false},{id:'demo-event-2',name:'小组作业讨论',date:tomorrow,time:'19:00',location:'图书馆二楼',people:'课程小组',note:'提前整理需求与问题。',done:false}];
 s.grades=[{id:'demo-grade-1',name:'高等数学 A',credit:3,score:90,semester:'模拟第一学期'},{id:'demo-grade-2',name:'大学英语',credit:2,score:80,semester:'模拟第一学期'}];
 s.parcels=[{id:'demo-parcel-1',name:'新学期的笔记本',station:'校园快递站',code:'示例 2-3-0816',deadline:today,done:false},{id:'demo-parcel-2',name:'运动水杯',station:'西门快递柜',code:'示例 A-0921',deadline:tomorrow,done:false}];return s;
}
