import os, json, joblib, warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors
from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier, XGBRegressor
warnings.filterwarnings("ignore")

DATA="data/nivara_real_paima_2025_26.csv"
OUT="models/real_2025_26"
os.makedirs(OUT,exist_ok=True)
df=pd.read_csv(DATA)

FEATURES=["original_cost_crore","revised_cost_crore","cumulative_expenditure_crore",
          "physical_progress_pct","expenditure_ratio","cost_change_ratio",
          "schedule_delay_months","month_num","agency","state"]

def train_risk(h):
    d=df.dropna(subset=[f"label_{h}m"]).copy()
    target=f"label_{h}m"
    # Only rows with a real future observation at the requested horizon.
    d=d[d[f"physical_progress_f{h}m"].notna()].copy()
    X=d[FEATURES].copy()
    X["agency"]=X["agency"].fillna("UNKNOWN").astype(str)
    X["state"]=X["state"].fillna("UNKNOWN").astype(str)
    y=d[target].astype(int)
    cat=[X.columns.get_loc(c) for c in ["agency","state"]]
    gss=GroupShuffleSplit(n_splits=1,test_size=0.2,random_state=42)
    tr,te=next(gss.split(X,y,groups=d["project_code"]))
    Xtr,Xte,ytr,yte=X.iloc[tr],X.iloc[te],y.iloc[tr],y.iloc[te]

    models={
        "catboost":CatBoostClassifier(iterations=400,depth=6,learning_rate=0.05,
                                      loss_function="Logloss",verbose=False,random_seed=42),
        "lightgbm":LGBMClassifier(n_estimators=400,max_depth=6,learning_rate=0.05,
                                  verbosity=-1,random_state=42),
        "xgboost":XGBClassifier(n_estimators=400,max_depth=6,learning_rate=0.05,
                                eval_metric="logloss",random_state=42)
    }
    scores={}
    for name,m in models.items():
        if name=="catboost":
            m.fit(Xtr,ytr,cat_features=cat)
        else:
            # Native categorical handling isn't used here; use pandas category codes.
            Xt=Xtr.copy(); Xe=Xte.copy()
            for c in ["agency","state"]:
                cats=pd.concat([Xt[c],Xe[c]]).astype("category").cat.categories
                mp={v:i for i,v in enumerate(cats)}
                Xt[c]=Xt[c].map(mp).fillna(-1)
                Xe[c]=Xe[c].map(mp).fillna(-1)
            m.fit(Xt,ytr)
        if name=="catboost":
            p=m.predict_proba(Xte)[:,1]
        else:
            p=m.predict_proba(Xe)[:,1]
        pred=(p>=0.5).astype(int)
        scores[name]={
            "roc_auc":float(roc_auc_score(yte,p)),
            "precision":float(precision_score(yte,pred,zero_division=0)),
            "recall":float(recall_score(yte,pred,zero_division=0)),
            "f1":float(f1_score(yte,pred,zero_division=0)),
            "n_test":int(len(yte))
        }
        joblib.dump(m,os.path.join(OUT,f"risk_{h}m_{name}.joblib"))
    best=max(scores,key=lambda k:scores[k]["roc_auc"])
    with open(os.path.join(OUT,f"risk_{h}m_metrics.json"),"w") as f:
        json.dump({"best":best,"scores":scores},f,indent=2)
    print(f"\nRISK {h}M")
    for k,v in scores.items():
        print(f"{k:9s} AUC={v['roc_auc']:.4f} P={v['precision']:.4f} R={v['recall']:.4f} F1={v['f1']:.4f}")
    print("BEST =",best)

def train_cost(h):
    d=df[df[f"future_cost_change_{h}m"].notna()].copy()
    X=d[FEATURES].copy()
    # XGBoost gets categorical columns encoded consistently.
    for c in ["agency","state"]:
        X[c]=X[c].astype("category").cat.codes
    y=d[f"future_cost_change_{h}m"]
    gss=GroupShuffleSplit(n_splits=1,test_size=0.2,random_state=42)
    tr,te=next(gss.split(X,y,groups=d["project_code"]))
    m=XGBRegressor(n_estimators=500,max_depth=6,learning_rate=0.05,
                   objective="reg:squarederror",random_state=42)
    m.fit(X.iloc[tr],y.iloc[tr])
    p=m.predict(X.iloc[te])
    metrics={"mae":float(mean_absolute_error(y.iloc[te],p)),
             "rmse":float(np.sqrt(mean_squared_error(y.iloc[te],p))),
             "r2":float(r2_score(y.iloc[te],p)),
             "n_test":int(len(te))}
    joblib.dump(m,os.path.join(OUT,f"cost_{h}m_xgboost.joblib"))
    with open(os.path.join(OUT,f"cost_{h}m_metrics.json"),"w") as f: json.dump(metrics,f,indent=2)
    print(f"COST {h}M  MAE={metrics['mae']:.4f} RMSE={metrics['rmse']:.4f} R2={metrics['r2']:.4f}")

# Train on real 2025-26 monthly snapshots available in the uploaded Flash Reports.
train_risk(3)
train_risk(6)
train_cost(3)
train_cost(6)

# Unsupervised models: fit only on the 2025-26 reference data.
d=df.dropna(subset=["physical_progress_pct","expenditure_ratio","cost_change_ratio"]).copy()
NUM=["original_cost_crore","revised_cost_crore","cumulative_expenditure_crore",
     "physical_progress_pct","expenditure_ratio","cost_change_ratio","schedule_delay_months","month_num"]
scaler=StandardScaler()
Z=scaler.fit_transform(d[NUM])
iso=IsolationForest(n_estimators=300,contamination=0.05,random_state=42)
iso.fit(Z)
joblib.dump({"scaler":scaler,"model":iso,"features":NUM},os.path.join(OUT,"anomaly_iforest.joblib"))

knn=NearestNeighbors(n_neighbors=min(6,len(d)),metric="euclidean")
knn.fit(Z)
joblib.dump({"scaler":scaler,"model":knn,"features":NUM,
             "index_project_ids":d["project_code"].astype(str).tolist()},os.path.join(OUT,"similarity_knn.joblib"))
print(f"ANOMALY/KNN trained on {len(d)} real 2025-26 project-month rows.")
print("\nREAL 2025-26 TABULAR TRAINING COMPLETE.")
