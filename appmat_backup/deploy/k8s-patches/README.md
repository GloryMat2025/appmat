my-api: enable Claude Sonnet 4.5 

This folder contains a JSON patch that adds ENABLE_CLAUDE_SONNET_4_5=true to the first container of the my-api Deployment.
 
Usage:  
1. Replace my-namespace with your target namespace if different.  
2. Apply the patch:  
kubectl patch deployment my-api -n my-namespace --type=json --patch-file=deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json 
 
Verify rollout:  
kubectl rollout status deployment/my-api -n my-namespace  
kubectl get pods -n my-namespace -l app=my-api -o wide  
kubectl logs -n my-namespace -l app=my-api --tail=200 
 
Rollback (quick):  
kubectl set env deployment/my-api -n my-namespace ENABLE_CLAUDE_SONNET_4_5-  
kubectl rollout restart deployment/my-api -n my-namespace 
